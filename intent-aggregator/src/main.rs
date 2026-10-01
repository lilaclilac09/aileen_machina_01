mod decide;
mod jev;
mod questions;
mod risk;
mod transcribe;

use std::path::PathBuf;

use axum::body::Body;
use axum::extract::{DefaultBodyLimit, Multipart};
use axum::http::{header, StatusCode};
use axum::response::Response;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::decide::decide;
use crate::jev::call_jev;
use crate::questions::{questions_for, Scenario};
use crate::risk::{review_purchase, Limits, PurchaseReview};
use crate::transcribe::{allowed_audio, transcribe_file, MAX_AUDIO_BYTES};

const INDEX: &str = include_str!("../static/index.html");
const MAX_TEXT: usize = 8000;
const EMOTION_LEGEND: &str = "t_sec is seconds from the start of the recording. dominant is the model's top label for that frame. scores are that model's probabilities. Expressions are not emotions. This timeline is a noisy reference only.";

#[derive(Deserialize)]
struct AnalyzeRequest {
    scenario: String,
    text: String,
    limits: Option<Limits>,
    emotion_timeline: Option<Value>,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(index))
        .route("/api/analyze", post(analyze))
        .route("/api/transcribe", post(transcribe))
        .layer(DefaultBodyLimit::max(MAX_AUDIO_BYTES));
    let port = std::env::var("PORT").unwrap_or_else(|_| "8788".into());
    let addr = format!("127.0.0.1:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|error| panic!("listen {addr}: {error}"));
    eprintln!("intent-aggregator http://{addr}");
    axum::serve(listener, app)
        .await
        .unwrap_or_else(|error| panic!("serve: {error}"));
}

async fn index() -> Response {
    Response::builder()
        .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
        .body(Body::from(INDEX))
        .unwrap()
}

fn error_response(status: u16, message: &str) -> Response {
    Response::builder()
        .status(StatusCode::from_u16(status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR))
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json!({ "error": message }).to_string()))
        .unwrap()
}

fn json_response(status: u16, body: Value) -> Response {
    Response::builder()
        .status(StatusCode::from_u16(status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR))
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(body.to_string()))
        .unwrap()
}

async fn analyze(Json(request): Json<AnalyzeRequest>) -> Response {
    let Some(scenario) = Scenario::parse(&request.scenario) else {
        return error_response(400, "scenario must be customer, meeting, or ticket");
    };
    let text = request.text.trim();
    if text.is_empty() {
        return error_response(400, "text is empty");
    }
    if text.len() > MAX_TEXT {
        return error_response(400, "text is too long");
    }

    let mut state = json!({
        "scenario": request.scenario,
        "text": text,
    });
    if scenario == Scenario::Meeting {
        if let Some(timeline) = request.emotion_timeline {
            if timeline.is_array() {
                state["emotion_timeline"] = timeline;
                state["emotion_legend"] = json!(EMOTION_LEGEND);
            }
        }
    }

    let answers = match call_jev(&state, &questions_for(scenario)).await {
        Ok(answers) => answers,
        Err(error) => {
            let (status, message) = error.public_pair();
            eprintln!("[intent] status {status}");
            return error_response(status, message);
        }
    };
    let map: serde_json::Map<String, Value> = answers.clone().into_iter().collect();
    let mut decision = decide(scenario, &map);
    let mut payment = None;
    if decision.suggested_action == "follow_up" {
        match review_purchase(text, &map, request.limits.as_ref()).await {
            Ok(PurchaseReview::Ready(intent)) => {
                decision.suggested_action = "ready_to_pay".into();
                payment = Some(intent);
            }
            Ok(PurchaseReview::Manual) => {
                decision.suggested_action = "review_manually".into();
            }
            Ok(PurchaseReview::NotPurchase) => {}
            Err(error) => {
                let (status, message) = error.public_pair();
                eprintln!("[intent] risk status {status}");
                return error_response(status, message);
            }
        }
    }

    let mut body = json!({
        "answers": answers,
        "suggested_action": decision.suggested_action,
    });
    if !decision.low_confidence.is_empty() {
        body["low_confidence"] = json!(decision.low_confidence);
    }
    if let Some(intent) = payment {
        body["payment_intent"] = json!(intent);
    }
    json_response(200, body)
}

async fn transcribe(mut multipart: Multipart) -> Response {
    let mut saved: Option<PathBuf> = None;
    let dir = std::env::temp_dir().join(format!(
        "intent-audio-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0)
    ));
    if tokio::fs::create_dir_all(&dir).await.is_err() {
        return error_response(500, "could not store the audio");
    }

    let response = loop {
        let field = match multipart.next_field().await {
            Ok(Some(field)) => field,
            Ok(None) => break error_response(400, "audio file is missing"),
            Err(_) => break error_response(400, "could not read the upload"),
        };
        let filename = field.file_name().unwrap_or("").to_string();
        if !allowed_audio(&filename) {
            break error_response(400, "audio must be mp3, wav, or m4a");
        }
        let bytes = match field.bytes().await {
            Ok(bytes) => bytes,
            Err(_) => break error_response(400, "could not read the upload"),
        };
        if bytes.len() > MAX_AUDIO_BYTES {
            break error_response(413, "audio is larger than 100MB");
        }
        let ext = std::path::Path::new(&filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("mp3")
            .to_ascii_lowercase();
        let path = dir.join(format!("upload.{ext}"));
        if tokio::fs::write(&path, &bytes).await.is_err() {
            break error_response(500, "could not store the audio");
        }
        saved = Some(path);
        break match transcribe_file(saved.as_ref().unwrap()).await {
            Ok(body) => json_response(200, body),
            Err(message) if message == "whisper is not installed" => error_response(503, &message),
            Err(_) => error_response(502, "whisper failed"),
        };
    };
    if let Some(path) = saved {
        let _ = tokio::fs::remove_file(&path).await;
    }
    let _ = tokio::fs::remove_dir_all(&dir).await;
    response
}
