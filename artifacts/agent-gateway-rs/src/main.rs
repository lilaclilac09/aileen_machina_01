use std::collections::VecDeque;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use axum::body::Body;
use axum::extract::{DefaultBodyLimit, State};
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{Html, Response};
use axum::routing::{get, post};
use axum::Router;
use bytes::Bytes;
use futures_util::StreamExt;
use serde_json::{json, Value};
use subtle::ConstantTimeEq;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;

const HOST: &str = "127.0.0.1";
const OPENAI_URL: &str = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL: &str = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION: &str = "2023-06-01";
const OPENAI_MODELS: &[&str] = &["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o4-mini"];
const ANTHROPIC_MODELS: &[&str] = &["claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5"];

#[derive(Clone)]
struct App {
    gateway_key: String,
    openai_key: String,
    anthropic_key: String,
    openai_url: String,
    anthropic_url: String,
    client: reqwest::Client,
    log: Arc<Mutex<VecDeque<LogLine>>>,
}

struct LogLine {
    at: String,
    model: String,
    tokens: String,
    latency_ms: u128,
    status: u16,
}

#[derive(Clone, Copy, PartialEq, Eq)]
#[derive(Debug)]
enum Provider {
    OpenAi,
    Anthropic,
}

fn provider_for(model: &str) -> Provider {
    if model.starts_with("claude") {
        Provider::Anthropic
    } else {
        Provider::OpenAi
    }
}

fn bearer_ok(header: Option<&str>, expected: &str) -> bool {
    let Some(raw) = header else { return false };
    let token = raw.trim().strip_prefix("Bearer").or_else(|| raw.trim().strip_prefix("bearer"));
    let Some(token) = token else { return false };
    let token = token.trim();
    if token.len() != expected.len() || expected.is_empty() || token.chars().any(char::is_whitespace) {
        return false;
    }
    token.as_bytes().ct_eq(expected.as_bytes()).into()
}

fn text_of(content: &Value) -> String {
    match content {
        Value::String(s) => s.clone(),
        Value::Array(parts) => parts
            .iter()
            .filter_map(|part| {
                if let Some(s) = part.as_str() {
                    return Some(s.to_string());
                }
                part.get("text").and_then(Value::as_str).map(str::to_string)
            })
            .collect::<Vec<_>>()
            .join(""),
        _ => String::new(),
    }
}

fn to_anthropic_body(body: &Value) -> Result<Value, (StatusCode, String)> {
    let messages = body.get("messages").and_then(Value::as_array);
    let mut system = Vec::new();
    let mut chat: Vec<Value> = Vec::new();
    for message in messages.cloned().unwrap_or_default() {
        let role = message.get("role").and_then(Value::as_str).unwrap_or("");
        if role == "system" {
            let text = text_of(message.get("content").unwrap_or(&Value::Null));
            if !text.is_empty() {
                system.push(text);
            }
            continue;
        }
        if role != "user" && role != "assistant" {
            return Err((
                StatusCode::BAD_REQUEST,
                format!("unsupported message role: {}", if role.is_empty() { "missing" } else { role }),
            ));
        }
        let text = text_of(message.get("content").unwrap_or(&Value::Null));
        if let Some(prev) = chat.last_mut() {
            if prev.get("role").and_then(Value::as_str) == Some(role) {
                let joined = format!("{}\n{text}", prev.get("content").and_then(Value::as_str).unwrap_or(""));
                prev["content"] = Value::String(joined);
                continue;
            }
        }
        chat.push(json!({ "role": role, "content": text }));
    }
    if chat.first().and_then(|m| m.get("role")).and_then(Value::as_str) != Some("user") {
        return Err((
            StatusCode::BAD_REQUEST,
            "anthropic messages must start with a user turn".into(),
        ));
    }
    let max_tokens = body
        .get("max_tokens")
        .and_then(Value::as_u64)
        .or_else(|| body.get("max_completion_tokens").and_then(Value::as_u64))
        .unwrap_or(1024);
    let mut out = json!({
        "model": body.get("model").cloned().unwrap_or(Value::Null),
        "max_tokens": max_tokens,
        "messages": chat,
        "stream": body.get("stream").and_then(Value::as_bool).unwrap_or(false),
    });
    if !system.is_empty() {
        out["system"] = Value::String(system.join("\n\n"));
    }
    if body.get("temperature").is_some() {
        out["temperature"] = body["temperature"].clone();
    }
    if body.get("top_p").is_some() {
        out["top_p"] = body["top_p"].clone();
    }
    if let Some(stop) = body.get("stop") {
        let seq = if let Some(list) = stop.as_array() {
            list.clone()
        } else {
            vec![stop.clone()]
        };
        out["stop_sequences"] = Value::Array(seq);
    }
    Ok(out)
}

fn from_anthropic(json: &Value) -> Value {
    let text = json
        .get("content")
        .and_then(Value::as_array)
        .map(|blocks| {
            blocks
                .iter()
                .filter(|block| block.get("type").and_then(Value::as_str) == Some("text"))
                .filter_map(|block| block.get("text").and_then(Value::as_str))
                .collect::<Vec<_>>()
                .join("")
        })
        .unwrap_or_default();
    let prompt = json.pointer("/usage/input_tokens").and_then(Value::as_u64).unwrap_or(0);
    let completion = json.pointer("/usage/output_tokens").and_then(Value::as_u64).unwrap_or(0);
    let finish = if json.get("stop_reason").and_then(Value::as_str) == Some("max_tokens") {
        "length"
    } else {
        "stop"
    };
    json!({
        "id": json.get("id").and_then(Value::as_str).unwrap_or("chatcmpl-gateway"),
        "object": "chat.completion",
        "created": now_secs(),
        "model": json.get("model").cloned().unwrap_or(Value::Null),
        "choices": [{
            "index": 0,
            "message": { "role": "assistant", "content": text },
            "finish_reason": finish
        }],
        "usage": {
            "prompt_tokens": prompt,
            "completion_tokens": completion,
            "total_tokens": prompt + completion
        }
    })
}

struct SseState {
    buf: String,
    id: String,
    model: String,
    prompt: u64,
    completion: u64,
}

fn openai_chunk(id: &str, model: &str, delta: Value, finish: Option<&str>, usage: Option<Value>) -> String {
    let mut chunk = json!({
        "id": id,
        "object": "chat.completion.chunk",
        "created": now_secs(),
        "model": model,
        "choices": [{ "index": 0, "delta": delta, "finish_reason": finish }],
    });
    if let Some(usage) = usage {
        chunk["usage"] = usage;
    }
    format!("data: {chunk}\n\n")
}

fn anthropic_sse_to_openai(chunk: &str, state: &mut SseState) -> String {
    state.buf.push_str(chunk);
    let mut out = String::new();
    while let Some(idx) = state.buf.find('\n') {
        let line = state.buf[..idx].trim_end_matches('\r').to_string();
        state.buf.drain(..=idx);
        if !line.starts_with("data:") {
            continue;
        }
        let raw = line[5..].trim();
        if raw.is_empty() || raw == "[DONE]" {
            continue;
        }
        let Ok(event) = serde_json::from_str::<Value>(raw) else { continue };
        match event.get("type").and_then(Value::as_str) {
            Some("message_start") => {
                if let Some(id) = event.pointer("/message/id").and_then(Value::as_str) {
                    state.id = id.to_string();
                }
                if let Some(model) = event.pointer("/message/model").and_then(Value::as_str) {
                    state.model = model.to_string();
                }
                if let Some(n) = event.pointer("/message/usage/input_tokens").and_then(Value::as_u64) {
                    state.prompt = n;
                }
                out.push_str(&openai_chunk(
                    &state.id,
                    &state.model,
                    json!({"role": "assistant", "content": ""}),
                    None,
                    None,
                ));
            }
            Some("content_block_delta") if event.pointer("/delta/type").and_then(Value::as_str) == Some("text_delta") => {
                let text = event.pointer("/delta/text").and_then(Value::as_str).unwrap_or("");
                out.push_str(&openai_chunk(&state.id, &state.model, json!({"content": text}), None, None));
            }
            Some("message_delta") => {
                if let Some(n) = event.pointer("/usage/output_tokens").and_then(Value::as_u64) {
                    state.completion = n;
                }
                let finish = if event.pointer("/delta/stop_reason").and_then(Value::as_str) == Some("max_tokens") {
                    "length"
                } else {
                    "stop"
                };
                let usage = json!({
                    "prompt_tokens": state.prompt,
                    "completion_tokens": state.completion,
                    "total_tokens": state.prompt + state.completion
                });
                out.push_str(&openai_chunk(&state.id, &state.model, json!({}), Some(finish), Some(usage)));
            }
            Some("message_stop") => out.push_str("data: [DONE]\n\n"),
            _ => {}
        }
    }
    out
}

fn now_secs() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

fn stamp() -> String {
    let secs = now_secs();
    let days = secs / 86_400;
    let tod = secs % 86_400;
    let (h, m, s) = (tod / 3600, (tod % 3600) / 60, tod % 60);
    // Civil date from Unix epoch, UTC. Enough for a local log line.
    let z = days as i64 + 719_468;
    let era = z.div_euclid(146_097);
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let mth = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = if mth <= 2 { y + 1 } else { y };
    format!("{year:04}-{mth:02}-{d:02}T{h:02}:{m:02}:{s:02}Z")
}

fn tokens_from_text(text: &str) -> String {
    let mut last = None;
    let mut rest = text;
    while let Some(idx) = rest.find("\"total_tokens\"") {
        rest = &rest[idx + 14..];
        let digits: String = rest.trim_start_matches(|c: char| c == ' ' || c == ':').chars().take_while(|c| c.is_ascii_digit()).collect();
        if !digits.is_empty() {
            last = Some(digits);
        }
    }
    last.unwrap_or_else(|| "-".into())
}

fn record(app: &App, model: &str, tokens: &str, started: Instant, status: u16) {
    let latency_ms = started.elapsed().as_millis();
    let line = format!("{} {model} {tokens} {latency_ms}ms", stamp());
    println!("{line}");
    let mut log = app.log.lock().expect("log");
    if log.len() == 40 {
        log.pop_front();
    }
    log.push_back(LogLine {
        at: stamp(),
        model: model.to_string(),
        tokens: tokens.to_string(),
        latency_ms,
        status,
    });
}

fn json_response(status: StatusCode, body: Value) -> Response {
    let payload = body.to_string();
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, "application/json; charset=utf-8")
        .body(Body::from(payload))
        .unwrap()
}

fn unauthorized() -> Response {
    json_response(
        StatusCode::UNAUTHORIZED,
        json!({"error": {"message": "invalid gateway bearer", "type": "auth_error", "code": "gateway_unauthorized"}}),
    )
}

fn require_auth(headers: &HeaderMap, app: &App) -> Result<(), Response> {
    let value = headers.get(header::AUTHORIZATION).and_then(|v| v.to_str().ok());
    if bearer_ok(value, &app.gateway_key) {
        Ok(())
    } else {
        Err(unauthorized())
    }
}

async fn dashboard(State(app): State<App>) -> Html<String> {
    let rows = app.log.lock().expect("log");
    let body = rows.iter().rev().map(|row| {
        format!(
            "<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}ms</td></tr>",
            esc(&row.at),
            esc(&row.model),
            row.status,
            esc(&row.tokens),
            row.latency_ms
        )
    }).collect::<String>();
    drop(rows);
    let openai = if app.openai_key.is_empty() { "empty" } else { "set" };
    let anthropic = if app.anthropic_key.is_empty() { "empty" } else { "set" };
    Html(format!(
        r#"<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>agent gateway</title>
<meta http-equiv="refresh" content="3">
<style>
body{{margin:0;background:#f6f1e8;color:#1c1915;font:16px/1.45 ui-sans-serif,system-ui,sans-serif}}
main{{max-width:760px;margin:48px auto;padding:0 20px}}
h1{{font-weight:450;font-size:1.35rem;letter-spacing:-.02em;margin:0 0 8px}}
p{{color:#5c6764;margin:0 0 18px}}
.pill{{display:inline-block;margin-right:8px;padding:2px 8px;border-radius:999px;background:#d8eeeb;color:#1c1915}}
table{{width:100%;border-collapse:collapse;font-size:.85rem;font-variant-numeric:tabular-nums}}
th{{text-align:left;font-weight:500;color:#3d6f6a}}
td,th{{padding:8px 0;border-bottom:1px solid #e4ddd0}}
</style></head><body><main>
<h1>agent gateway</h1>
<p>127.0.0.1 · official keys only · claude* → anthropic · else → openai</p>
<p><span class="pill">openai {openai}</span><span class="pill">anthropic {anthropic}</span></p>
<table><thead><tr><th>time</th><th>model</th><th>status</th><th>tokens</th><th>latency</th></tr></thead>
<tbody>{body}</tbody></table>
</main></body></html>"#
    ))
}

fn esc(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;")
}

async fn models(State(app): State<App>, headers: HeaderMap) -> Response {
    if let Err(res) = require_auth(&headers, &app) {
        return res;
    }
    let mut data = Vec::new();
    if !app.openai_key.is_empty() {
        for id in OPENAI_MODELS {
            data.push(json!({"id": id, "object": "model", "owned_by": "openai"}));
        }
    }
    if !app.anthropic_key.is_empty() {
        for id in ANTHROPIC_MODELS {
            data.push(json!({"id": id, "object": "model", "owned_by": "anthropic"}));
        }
    }
    json_response(StatusCode::OK, json!({"object": "list", "data": data}))
}

async fn chat(State(app): State<App>, headers: HeaderMap, body: Bytes) -> Response {
    if let Err(res) = require_auth(&headers, &app) {
        return res;
    }
    let started = Instant::now();
    let parsed: Value = match serde_json::from_slice(&body) {
        Ok(v) => v,
        Err(_) => return json_response(StatusCode::BAD_REQUEST, json!({"error": {"message": "invalid json", "type": "invalid_request_error"}})),
    };
    let model = parsed.get("model").and_then(Value::as_str).unwrap_or("").to_string();
    let provider = provider_for(&model);
    let (key, url) = match provider {
        Provider::OpenAi => (app.openai_key.as_str(), app.openai_url.as_str()),
        Provider::Anthropic => (app.anthropic_key.as_str(), app.anthropic_url.as_str()),
    };
    if key.is_empty() {
        let which = if provider == Provider::OpenAi { "OPENAI_API_KEY" } else { "ANTHROPIC_API_KEY" };
        record(&app, &model, "-", started, 401);
        return json_response(
            StatusCode::UNAUTHORIZED,
            json!({"error": {"message": format!("{which} is empty"), "type": "auth_error", "code": "missing_api_key"}}),
        );
    }

    let stream = parsed.get("stream").and_then(Value::as_bool).unwrap_or(false);
    let upstream_body = if provider == Provider::Anthropic {
        match to_anthropic_body(&parsed) {
            Ok(v) => v.to_string(),
            Err((status, message)) => {
                record(&app, &model, "-", started, status.as_u16());
                return json_response(status, json!({"error": {"message": message, "type": "invalid_request_error"}}));
            }
        }
    } else {
        String::from_utf8_lossy(&body).into_owned()
    };

    let mut req = app.client.post(url).header(header::CONTENT_TYPE, "application/json").body(upstream_body);
    req = if provider == Provider::OpenAi {
        req.header(header::AUTHORIZATION, format!("Bearer {key}"))
    } else {
        req.header("x-api-key", key).header("anthropic-version", ANTHROPIC_VERSION)
    };
    let upstream = match req.send().await {
        Ok(res) => res,
        Err(err) => {
            record(&app, &model, "-", started, 502);
            return json_response(StatusCode::BAD_GATEWAY, json!({"error": {"message": err.to_string(), "type": "api_error"}}));
        }
    };

    if provider == Provider::Anthropic && upstream.status().is_success() && stream {
        return anthropic_stream(app, model, started, upstream).await;
    }
    if provider == Provider::Anthropic && upstream.status().is_success() {
        let status = upstream.status();
        let json: Value = match upstream.json().await {
            Ok(v) => v,
            Err(err) => {
                record(&app, &model, "-", started, 502);
                return json_response(StatusCode::BAD_GATEWAY, json!({"error": {"message": err.to_string(), "type": "api_error"}}));
            }
        };
        let shaped = from_anthropic(&json);
        let tokens = shaped.pointer("/usage/total_tokens").and_then(Value::as_u64).map(|n| n.to_string()).unwrap_or_else(|| "-".into());
        record(&app, &model, &tokens, started, status.as_u16());
        return json_response(StatusCode::OK, shaped);
    }
    pipe_upstream(app, model, started, upstream).await
}

async fn pipe_upstream(app: App, model: String, started: Instant, upstream: reqwest::Response) -> Response {
    let status = upstream.status();
    let content_type = upstream
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("application/json")
        .to_string();
    let (tx, rx) = mpsc::channel::<Result<Bytes, std::io::Error>>(8);
    tokio::spawn(async move {
        let mut stream = upstream.bytes_stream();
        let mut seen = String::new();
        while let Some(item) = stream.next().await {
            match item {
                Ok(chunk) => {
                    if seen.len() < 200_000 {
                        seen.push_str(&String::from_utf8_lossy(&chunk));
                    }
                    if tx.send(Ok(chunk)).await.is_err() {
                        return;
                    }
                }
                Err(err) => {
                    let _ = tx.send(Err(std::io::Error::other(err))).await;
                    break;
                }
            }
        }
        let tokens = if let Some(json) = serde_json::from_str::<Value>(&seen).ok() {
            if let Some(n) = json.pointer("/usage/total_tokens").and_then(Value::as_u64) {
                n.to_string()
            } else {
                tokens_from_text(&seen)
            }
        } else {
            tokens_from_text(&seen)
        };
        record(&app, &model, &tokens, started, status.as_u16());
    });
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CACHE_CONTROL, "no-cache")
        .body(Body::from_stream(ReceiverStream::new(rx)))
        .unwrap()
}

async fn anthropic_stream(app: App, model: String, started: Instant, upstream: reqwest::Response) -> Response {
    let (tx, rx) = mpsc::channel::<Result<Bytes, std::io::Error>>(8);
    tokio::spawn(async move {
        let mut stream = upstream.bytes_stream();
        let mut state = SseState {
            buf: String::new(),
            id: "chatcmpl-gateway".into(),
            model: model.clone(),
            prompt: 0,
            completion: 0,
        };
        while let Some(item) = stream.next().await {
            match item {
                Ok(chunk) => {
                    let text = String::from_utf8_lossy(&chunk);
                    let converted = anthropic_sse_to_openai(&text, &mut state);
                    if !converted.is_empty() && tx.send(Ok(Bytes::from(converted))).await.is_err() {
                        return;
                    }
                }
                Err(err) => {
                    let _ = tx.send(Err(std::io::Error::other(err))).await;
                    break;
                }
            }
        }
        if !state.buf.trim().is_empty() {
            let converted = anthropic_sse_to_openai("\n", &mut state);
            if !converted.is_empty() {
                let _ = tx.send(Ok(Bytes::from(converted))).await;
            }
        }
        let tokens = state.prompt + state.completion;
        let token_s = if tokens > 0 { tokens.to_string() } else { "-".into() };
        record(&app, &model, &token_s, started, 200);
    });
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/event-stream; charset=utf-8")
        .header(header::CACHE_CONTROL, "no-cache")
        .body(Body::from_stream(ReceiverStream::new(rx)))
        .unwrap()
}

fn router(app: App) -> Router {
    Router::new()
        .route("/", get(dashboard))
        .route("/v1/models", get(models))
        .route("/v1/chat/completions", post(chat))
        .layer(DefaultBodyLimit::max(8 * 1024 * 1024))
        .with_state(app)
}

fn env_or(name: &str, default: &str) -> String {
    std::env::var(name).ok().filter(|v| !v.is_empty()).unwrap_or_else(|| default.to_string())
}

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();
    if let Ok(host) = std::env::var("GATEWAY_HOST") {
        if host != HOST {
            eprintln!("refusing to bind {host}; this gateway listens on 127.0.0.1 only");
            std::process::exit(1);
        }
    }
    let gateway_key = std::env::var("GATEWAY_API_KEY").unwrap_or_default();
    if gateway_key.is_empty() {
        eprintln!("GATEWAY_API_KEY is empty");
        std::process::exit(1);
    }
    let port: u16 = env_or("GATEWAY_PORT", "8787").parse().unwrap_or(8787);
    let app = App {
        gateway_key,
        openai_key: std::env::var("OPENAI_API_KEY").unwrap_or_default(),
        anthropic_key: std::env::var("ANTHROPIC_API_KEY").unwrap_or_default(),
        openai_url: OPENAI_URL.into(),
        anthropic_url: ANTHROPIC_URL.into(),
        client: reqwest::Client::builder().connect_timeout(std::time::Duration::from_secs(15)).build().expect("client"),
        log: Arc::new(Mutex::new(VecDeque::new())),
    };
    let addr: SocketAddr = format!("{HOST}:{port}").parse().unwrap();
    let listener = tokio::net::TcpListener::bind(addr).await.expect("bind 127.0.0.1");
    println!("agent-gateway http://{HOST}:{}", listener.local_addr().unwrap().port());
    axum::serve(listener, router(app)).with_graceful_shutdown(async {
        let _ = tokio::signal::ctrl_c().await;
    }).await.expect("serve");
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::serve;

    fn test_app(openai_url: &str, anthropic_url: &str, openai_key: &str, anthropic_key: &str) -> App {
        App {
            gateway_key: "gate-test".into(),
            openai_key: openai_key.into(),
            anthropic_key: anthropic_key.into(),
            openai_url: openai_url.into(),
            anthropic_url: anthropic_url.into(),
            client: reqwest::Client::new(),
            log: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    async fn spawn(app: App) -> String {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}", listener.local_addr().unwrap());
        tokio::spawn(async move {
            serve(listener, router(app)).await.unwrap();
        });
        url
    }

    #[test]
    fn routes_by_prefix() {
        assert_eq!(provider_for("claude-sonnet-4-5"), Provider::Anthropic);
        assert_eq!(provider_for("claude"), Provider::Anthropic);
        assert_eq!(provider_for("gpt-4o-mini"), Provider::OpenAi);
        assert_eq!(provider_for("o4-mini"), Provider::OpenAi);
        assert_eq!(provider_for("deepseek-chat"), Provider::OpenAi);
    }

    #[test]
    fn bearer_rejects_mismatch() {
        assert!(bearer_ok(Some("Bearer gate-test"), "gate-test"));
        assert!(!bearer_ok(Some("Bearer gate-tes"), "gate-test"));
        assert!(!bearer_ok(Some("Bearer gate-test-extra"), "gate-test"));
        assert!(!bearer_ok(None, "gate-test"));
        assert!(!bearer_ok(Some("Bearer gate-test"), ""));
    }

    #[tokio::test]
    async fn auth_models_passthrough_and_claude_sse() {
        let upstream = Router::new().route("/openai", post(|body: Bytes| async move {
            assert!(std::str::from_utf8(&body).unwrap().contains("gpt-4o-mini"));
            (
                StatusCode::TOO_MANY_REQUESTS,
                [("content-type", "application/json")],
                r#"{"error":{"message":"insufficient_quota","type":"insufficient_quota"}}"#,
            )
        })).route("/anthropic", post(|| async {
            let events = [
                json!({"type":"message_start","message":{"id":"msg_1","model":"claude-sonnet-4-5","usage":{"input_tokens":3}}}),
                json!({"type":"content_block_delta","delta":{"type":"text_delta","text":"pong"}}),
                json!({"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":1}}),
                json!({"type":"message_stop"}),
            ];
            let text = events.iter().map(|e| format!("data: {e}\n\n")).collect::<String>();
            (StatusCode::OK, [("content-type", "text/event-stream")], text)
        }));
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        tokio::spawn(async move { serve(listener, upstream).await.unwrap() });

        let app = test_app(&format!("{base}/openai"), &format!("{base}/anthropic"), "sk-test", "sk-ant");
        let url = spawn(app).await;
        let client = reqwest::Client::new();

        let no_auth = client.get(format!("{url}/v1/models")).send().await.unwrap();
        assert_eq!(no_auth.status(), 401);

        let models = client.get(format!("{url}/v1/models")).header("authorization", "Bearer gate-test").send().await.unwrap();
        let listed: Value = models.json().await.unwrap();
        let ids: Vec<&str> = listed["data"].as_array().unwrap().iter().filter_map(|r| r["id"].as_str()).collect();
        assert!(ids.contains(&"gpt-4o-mini"));
        assert!(ids.contains(&"claude-sonnet-4-5"));

        let quota = client.post(format!("{url}/v1/chat/completions")).header("authorization", "Bearer gate-test").json(&json!({"model":"gpt-4o-mini","messages":[{"role":"user","content":"ping"}]})).send().await.unwrap();
        assert_eq!(quota.status(), 429);
        assert_eq!(quota.text().await.unwrap(), r#"{"error":{"message":"insufficient_quota","type":"insufficient_quota"}}"#);

        let sse = client.post(format!("{url}/v1/chat/completions")).header("authorization", "Bearer gate-test").json(&json!({"model":"claude-sonnet-4-5","stream":true,"messages":[{"role":"user","content":"ping"}]})).send().await.unwrap();
        assert_eq!(sse.status(), 200);
        let text = sse.text().await.unwrap();
        assert!(text.contains("pong"));
        assert!(text.contains("[DONE]"));

        let dash = client.get(&url).send().await.unwrap().text().await.unwrap();
        assert!(dash.contains("agent gateway"));
        assert!(!dash.contains("sk-test"));
        assert!(!dash.contains("sk-ant"));
        assert!(!dash.contains("gate-test"));
    }

    #[tokio::test]
    async fn empty_key_does_not_call_upstream() {
        let app = test_app("http://127.0.0.1:1/nope", "http://127.0.0.1:1/nope", "", "");
        let url = spawn(app).await;
        let res = reqwest::Client::new()
            .post(format!("{url}/v1/chat/completions"))
            .header("authorization", "Bearer gate-test")
            .json(&json!({"model":"claude-haiku-4-5","messages":[{"role":"user","content":"ping"}]}))
            .send()
            .await
            .unwrap();
        assert_eq!(res.status(), 401);
        let json: Value = res.json().await.unwrap();
        assert!(json["error"]["message"].as_str().unwrap().contains("ANTHROPIC_API_KEY is empty"));
    }
}
