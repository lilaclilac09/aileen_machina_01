use axum::{
    extract::State,
    response::Html,
    routing::{get, post},
    Json, Router,
};
use booking_lab::detect::{on_book, on_calendar, DetectConfig};
use booking_lab::kyc::Kyc;
use booking_lab::modes::{all_modes, mode_name, phase_name};
use booking_lab::page::render;
use booking_lab::state::AppState;
use booking_lab::traffic::run_drill;
use booking_lab::{BookRequest, CalendarQuery, DetectVerdict};
use serde::Deserialize;
use std::net::SocketAddr;
use std::time::{Duration, Instant};

#[derive(Clone)]
struct Lab {
    state: AppState,
    detect: DetectConfig,
    kyc: Kyc,
}

#[tokio::main]
async fn main() {
    let lab = Lab {
        state: AppState::new(),
        detect: DetectConfig::default(),
        kyc: Kyc::new(false),
    };
    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/", get(home))
        .route("/register", post(register))
        .route("/login_test", post(login_test))
        .route("/calendar", post(calendar))
        .route("/book", post(book))
        .route("/drill", post(drill))
        .route("/kyc/issue", post(kyc_issue))
        .route("/kyc/confirm", post(kyc_confirm))
        .route("/kyc/otp", post(kyc_otp))
        .route("/outbox", get(outbox))
        .with_state(lab);

    let addr = SocketAddr::from(([127, 0, 0, 1], 18080));
    println!("lab on http://{addr}");
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

#[derive(Deserialize)]
struct RegisterBody {
    email: String,
}

async fn register(State(lab): State<Lab>, Json(body): Json<RegisterBody>) -> Json<serde_json::Value> {
    let acc = lab.state.register(body.email);
    Json(serde_json::json!({ "id": acc.id, "email": acc.email }))
}

#[derive(Deserialize)]
struct LoginBody {
    account_id: String,
}

async fn login_test(State(lab): State<Lab>, Json(body): Json<LoginBody>) -> Json<serde_json::Value> {
    let s = lab.state.login_test(&body.account_id);
    Json(serde_json::json!({ "token": s.token, "account_id": s.account_id }))
}

async fn calendar(State(lab): State<Lab>, Json(q): Json<CalendarQuery>) -> Json<DetectVerdict> {
    let window = Duration::from_secs(lab.detect.calendar_window_secs);
    let n = lab.state.record_calendar_at(&q.ip, Instant::now(), window);
    Json(on_calendar(n, &q, &lab.detect))
}

async fn book(State(lab): State<Lab>, Json(req): Json<BookRequest>) -> Json<serde_json::Value> {
    let v = on_book(&req);
    if !v.allow {
        return Json(serde_json::json!({ "ok": false, "detect": v }));
    }
    match lab.state.try_book(&req.slot, &req.applicant) {
        Ok(()) => Json(serde_json::json!({ "ok": true, "detect": v })),
        Err(e) => Json(serde_json::json!({ "ok": false, "error": e, "detect": v })),
    }
}

async fn home(State(lab): State<Lab>) -> Html<String> {
    let report = run_drill(&lab.state, &lab.detect, 20, 30, 20);
    Html(render(&report))
}

async fn drill(State(lab): State<Lab>) -> Json<serde_json::Value> {
    let report = run_drill(&lab.state, &lab.detect, 20, 30, 20);
    let modes: Vec<_> = all_modes()
        .into_iter()
        .map(|mode| serde_json::json!({ "mode": mode_name(mode), "phase": phase_name(mode) }))
        .collect();
    Json(serde_json::json!({ "report": report, "modes": modes }))
}

#[derive(Deserialize)]
struct OtpBody {
    enabled: bool,
}

async fn kyc_otp(State(lab): State<Lab>, Json(body): Json<OtpBody>) -> Json<serde_json::Value> {
    lab.kyc.set_otp_enabled(body.enabled);
    Json(serde_json::json!({ "otp_enabled": body.enabled }))
}

#[derive(Deserialize)]
struct IssueBody {
    account_id: String,
    email: String,
}

async fn kyc_issue(State(lab): State<Lab>, Json(body): Json<IssueBody>) -> Json<serde_json::Value> {
    match lab.kyc.issue(&body.account_id, &body.email) {
        Ok(link) => Json(serde_json::json!({ "ok": true, "link": link })),
        Err(e) => Json(serde_json::json!({ "ok": false, "error": e })),
    }
}

#[derive(Deserialize)]
struct ConfirmBody {
    token: String,
    code: String,
}

async fn kyc_confirm(State(lab): State<Lab>, Json(body): Json<ConfirmBody>) -> Json<serde_json::Value> {
    match lab.kyc.confirm(&body.token, &body.code) {
        Ok(()) => Json(serde_json::json!({ "ok": true })),
        Err(e) => Json(serde_json::json!({ "ok": false, "error": e })),
    }
}

async fn outbox(State(lab): State<Lab>) -> Json<serde_json::Value> {
    let mail = lab.kyc.outbox();
    Json(serde_json::json!(mail
        .into_iter()
        .map(|m| serde_json::json!({ "to": m.to, "link": m.link, "code": m.code }))
        .collect::<Vec<_>>()))
}
