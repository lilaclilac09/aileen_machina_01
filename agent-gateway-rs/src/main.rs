mod access;

use std::collections::VecDeque;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use async_stream::stream;
use axum::body::Body;
use axum::extract::{ConnectInfo, Query, State};
use axum::http::{header, HeaderMap, Request, StatusCode};
use axum::middleware::{from_fn_with_state, Next};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, patch, post};
use axum::Json;
use axum::Router;
use bytes::Bytes;
use futures_util::StreamExt;
use serde::Deserialize;
use serde::Serialize;
use serde_json::{json, Value};

const OPENAI_URL: &str = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL: &str = "https://api.anthropic.com/v1/messages";
#[derive(Clone)]
struct App {
    client: reqwest::Client,
    openai_key: String,
    anthropic_key: String,
    dashboard_token: String,
    setup_token: String,
    bind: String,
    started: Instant,
    stats: Arc<Mutex<Stats>>,
    vault: Arc<access::Vault>,
    allow: Vec<ipnet::IpNet>,
    cors: Vec<String>,
}

#[derive(Default)]
struct Stats {
    requests: u64,
    ok: u64,
    err: u64,
    tokens_in: u64,
    tokens_out: u64,
    log: VecDeque<LogEntry>,
}

#[derive(Clone, Serialize)]
struct LogEntry {
    id: String,
    ts: u64,
    model: String,
    vendor: String,
    ms: u64,
    ok: bool,
    status: u16,
    tokens_in: u64,
    tokens_out: u64,
    stream: bool,
    error: Option<String>,
}

#[derive(Deserialize)]
struct ChatReq {
    #[serde(default)]
    model: Option<String>,
    #[serde(default)]
    messages: Option<Vec<Value>>,
    #[serde(default)]
    stream: Option<bool>,
    #[serde(default)]
    temperature: Option<Value>,
    #[serde(default)]
    max_tokens: Option<Value>,
    #[serde(default)]
    tools: Option<Value>,
    #[serde(default)]
    tool_choice: Option<Value>,
    #[serde(default)]
    response_format: Option<Value>,
    #[serde(default)]
    top_p: Option<Value>,
    #[serde(default)]
    max_completion_tokens: Option<Value>,
}

#[derive(Deserialize)]
struct DashQuery {
    token: Option<String>,
}

struct Mark {
    app: App,
    done: bool,
    id: String,
    model: String,
    vendor: String,
    started: Instant,
    stream: bool,
    key_id: String,
}

impl Mark {
    fn finish(&mut self, ok: bool, status: u16, tokens_in: u64, tokens_out: u64, error: Option<String>) {
        if self.done {
            return;
        }
        self.done = true;
        self.app.push(LogEntry {
            id: self.id.clone(),
            ts: unix_now(),
            model: self.model.clone(),
            vendor: self.vendor.clone(),
            ms: self.started.elapsed().as_millis() as u64,
            ok,
            status,
            tokens_in,
            tokens_out,
            stream: self.stream,
            error: error.map(clip),
        });
        let used = tokens_in.saturating_add(tokens_out);
        self.app.vault.charge(&self.key_id, used);
    }
}

impl Drop for Mark {
    fn drop(&mut self) {
        self.finish(false, 499, 0, 0, Some("client closed".into()));
    }
}

fn env_secs(name: &str, default: u64) -> u64 {
    std::env::var(name).ok().and_then(|value| value.parse().ok()).filter(|n| *n > 0).unwrap_or(default)
}

fn unix_now() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

fn clip(s: String) -> String {
    s.chars().take(240).collect()
}

fn vendor_of(model: &str) -> &'static str {
    let name = model.to_lowercase();
    if name.starts_with("claude") || name.starts_with("anthropic") {
        "anthropic"
    } else {
        "openai"
    }
}

fn mask_key(value: &str) -> String {
    if value.is_empty() {
        return "—".into();
    }
    if value.len() < 12 {
        return "…".into();
    }
    let head: String = value.chars().take(7).collect();
    let tail: String = value.chars().rev().take(4).collect::<String>().chars().rev().collect();
    format!("{head}…{tail}")
}

fn bearer_token(headers: &HeaderMap) -> String {
    headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|raw| raw.strip_prefix("Bearer "))
        .unwrap_or("")
        .to_string()
}

fn json_msg(status: StatusCode, message: &str) -> Response {
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json!({"error": message}).to_string()))
        .unwrap_or_else(|_| Response::new(Body::from("")))
}

fn content_text(content: Option<&Value>) -> String {
    match content {
        Some(Value::String(s)) => s.clone(),
        Some(Value::Array(parts)) => parts
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

fn openai_body(req: &ChatReq) -> Value {
    let mut map = serde_json::Map::new();
    if let Some(model) = &req.model {
        map.insert("model".into(), json!(model));
    }
    if let Some(messages) = &req.messages {
        map.insert("messages".into(), json!(messages));
    }
    if let Some(stream) = req.stream {
        map.insert("stream".into(), json!(stream));
    }
    if let Some(v) = &req.temperature {
        map.insert("temperature".into(), v.clone());
    }
    if let Some(v) = &req.max_tokens {
        map.insert("max_tokens".into(), v.clone());
    }
    if let Some(v) = &req.tools {
        map.insert("tools".into(), v.clone());
    }
    if let Some(v) = &req.tool_choice {
        map.insert("tool_choice".into(), v.clone());
    }
    if let Some(v) = &req.response_format {
        map.insert("response_format".into(), v.clone());
    }
    if let Some(v) = &req.top_p {
        map.insert("top_p".into(), v.clone());
    }
    if let Some(v) = &req.max_completion_tokens {
        map.insert("max_completion_tokens".into(), v.clone());
    }
    Value::Object(map)
}

fn to_anthropic(req: &ChatReq) -> Value {
    let mut system = Vec::new();
    let mut messages = Vec::new();
    if let Some(list) = &req.messages {
        for msg in list {
            let role = msg.get("role").and_then(Value::as_str).unwrap_or("");
            let text = content_text(msg.get("content"));
            if role == "system" {
                if !text.is_empty() {
                    system.push(text);
                }
            } else if role == "user" || role == "assistant" {
                messages.push(json!({"role": role, "content": text}));
            }
        }
    }
    let max_tokens = req
        .max_tokens
        .as_ref()
        .and_then(Value::as_u64)
        .or_else(|| req.max_completion_tokens.as_ref().and_then(Value::as_u64))
        .unwrap_or(4096);
    let mut out = json!({
        "model": req.model.clone().unwrap_or_default(),
        "max_tokens": max_tokens,
        "messages": messages,
        "stream": req.stream.unwrap_or(false),
    });
    if !system.is_empty() {
        out["system"] = json!(system.join("\n\n"));
    }
    if let Some(temperature) = &req.temperature {
        out["temperature"] = temperature.clone();
    }
    out
}

fn from_anthropic(v: &Value, model: &str) -> Value {
    let text = v
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
    let prompt = v.pointer("/usage/input_tokens").and_then(Value::as_u64).unwrap_or(0);
    let completion = v.pointer("/usage/output_tokens").and_then(Value::as_u64).unwrap_or(0);
    json!({
        "id": v.get("id").and_then(Value::as_str).unwrap_or("chatcmpl-gateway"),
        "object": "chat.completion",
        "created": unix_now(),
        "model": model,
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": text},
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": prompt,
            "completion_tokens": completion,
            "total_tokens": prompt + completion
        }
    })
}

fn usage_of(v: &Value) -> (u64, u64) {
    let Some(usage) = v.get("usage") else {
        return (0, 0);
    };
    let inn = usage.get("prompt_tokens").and_then(Value::as_u64).unwrap_or(0);
    let out = usage.get("completion_tokens").and_then(Value::as_u64).unwrap_or(0);
    (inn, out)
}

fn error_snippet(bytes: &[u8]) -> String {
    if let Ok(v) = serde_json::from_slice::<Value>(bytes) {
        if let Some(err) = v.get("error") {
            return clip(err.to_string());
        }
        return clip(v.to_string());
    }
    clip(String::from_utf8_lossy(bytes).into_owned())
}

fn sse_piece(line: &str) -> Option<String> {
    let raw = line.trim().strip_prefix("data:")?.trim();
    if raw.is_empty() || raw == "[DONE]" {
        return None;
    }
    let v: Value = serde_json::from_str(raw).ok()?;
    if v.get("type").and_then(Value::as_str) != Some("content_block_delta") {
        return None;
    }
    let text = v.pointer("/delta/text").and_then(Value::as_str)?;
    if text.is_empty() {
        None
    } else {
        Some(text.to_string())
    }
}

fn chunk_line(id: &str, model: &str, text: &str) -> String {
    let payload = json!({
        "id": id,
        "object": "chat.completion.chunk",
        "created": unix_now(),
        "model": model,
        "choices": [{"index": 0, "delta": {"content": text}, "finish_reason": null}]
    });
    format!("data: {payload}\n\n")
}

impl App {
    fn push(&self, entry: LogEntry) {
        let mut stats = self.stats.lock().unwrap_or_else(|err| err.into_inner());
        stats.requests += 1;
        if entry.ok {
            stats.ok += 1;
        } else {
            stats.err += 1;
        }
        stats.tokens_in += entry.tokens_in;
        stats.tokens_out += entry.tokens_out;
        stats.log.push_front(entry);
        if stats.log.len() > 80 {
            stats.log.pop_back();
        }
    }

    fn note(&self, id: &str, model: &str, vendor: &str, started: Instant, status: u16, stream: bool, tokens_in: u64, tokens_out: u64, error: Option<String>, key_id: &str) {
        let ok = (200..300).contains(&status) && error.is_none();
        self.vault.charge(key_id, tokens_in.saturating_add(tokens_out));
        self.push(LogEntry {
            id: id.to_string(),
            ts: unix_now(),
            model: model.to_string(),
            vendor: vendor.to_string(),
            ms: started.elapsed().as_millis() as u64,
            ok,
            status,
            tokens_in,
            tokens_out,
            stream,
            error: error.map(clip),
        });
    }

    fn snapshot(&self) -> Value {
        let stats = self.stats.lock().unwrap_or_else(|err| err.into_inner());
        json!({
            "uptime_s": self.started.elapsed().as_secs(),
            "requests": stats.requests,
            "ok": stats.ok,
            "err": stats.err,
            "tokens_in": stats.tokens_in,
            "tokens_out": stats.tokens_out,
            "openai": !self.openai_key.is_empty(),
            "anthropic": !self.anthropic_key.is_empty(),
            "openai_key": mask_key(&self.openai_key),
            "anthropic_key": mask_key(&self.anthropic_key),
            "keys": self.vault.list(),
            "bind": self.bind,
            "log": stats.log,
        })
    }
}

async fn health() -> Response {
    Response::builder()
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(r#"{"status":"ok"}"#))
        .unwrap_or_else(|_| Response::new(Body::from("")))
}

async fn dashboard() -> Response {
    html_page(DASHBOARD)
}

async fn troubleshoot() -> Response {
    html_page(TROUBLESHOOT)
}

async fn keys_page() -> Response {
    html_page(KEYS_PAGE)
}

fn html_page(body: &'static str) -> Response {
    Response::builder()
        .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
        .body(Body::from(body))
        .unwrap_or_else(|_| Response::new(Body::from("")))
}

async fn models(State(app): State<App>, headers: HeaderMap) -> Response {
    let Some(key_id) = app.vault.authorize(&bearer_token(&headers)) else {
        return json_msg(StatusCode::UNAUTHORIZED, "missing or bad gateway key");
    };
    if let Some(wait) = app.vault.limit(&key_id) {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            [(header::RETRY_AFTER, wait.to_string())],
            Json(json!({"error": "rate limit"})),
        )
            .into_response();
    }
    let mut data = Vec::new();
    if !app.openai_key.is_empty() {
        for id in ["gpt-4.1", "gpt-4o-mini"] {
            data.push(json!({"id": id, "object": "model", "owned_by": "openai"}));
        }
    }
    if !app.anthropic_key.is_empty() {
        for id in ["claude-sonnet-4-6", "claude-haiku-4-5"] {
            data.push(json!({"id": id, "object": "model", "owned_by": "anthropic"}));
        }
    }
    Response::builder()
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json!({"object": "list", "data": data}).to_string()))
        .unwrap_or_else(|_| Response::new(Body::from("")))
}

fn dashboard_ok(app: &App, headers: &HeaderMap, query: &DashQuery) -> bool {
    let header_token = headers.get("x-dashboard-token").and_then(|v| v.to_str().ok()).unwrap_or("");
    let query_token = query.token.as_deref().unwrap_or("");
    access::ct_eq(header_token, &app.dashboard_token) || access::ct_eq(query_token, &app.dashboard_token)
}

async fn stats(State(app): State<App>, ConnectInfo(peer): ConnectInfo<SocketAddr>, headers: HeaderMap, Query(query): Query<DashQuery>) -> Response {
    if !app.vault.edge_ok(&format!("stats:{}", peer.ip()), 30) {
        return json_msg(StatusCode::TOO_MANY_REQUESTS, "rate limit");
    }
    if !dashboard_ok(&app, &headers, &query) {
        return json_msg(StatusCode::UNAUTHORIZED, "dashboard unauthorized");
    }
    Response::builder()
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(app.snapshot().to_string()))
        .unwrap_or_else(|_| Response::new(Body::from("")))
}

async fn chat(State(app): State<App>, headers: HeaderMap, body: Bytes) -> Response {
    let Some(key_id) = app.vault.authorize(&bearer_token(&headers)) else {
        return json_msg(StatusCode::UNAUTHORIZED, "missing or bad gateway key");
    };
    if let Some(wait) = app.vault.limit(&key_id) {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            [(header::RETRY_AFTER, wait.to_string())],
            axum::Json(json!({"error": "rate limit"})),
        )
            .into_response();
    }
    let req: ChatReq = match serde_json::from_slice(&body) {
        Ok(req) => req,
        Err(_) => return json_msg(StatusCode::BAD_REQUEST, "invalid json"),
    };
    let model = req.model.clone().unwrap_or_default();
    let vendor = vendor_of(&model);
    let stream = req.stream.unwrap_or(false);
    let started = Instant::now();
    let id = format!("chatcmpl-{}", uuid::Uuid::new_v4().simple());
    if vendor == "anthropic" {
        if app.anthropic_key.is_empty() {
            app.note(&id, &model, vendor, started, 400, stream, 0, 0, Some("ANTHROPIC_API_KEY is missing".into()), &key_id);
            return json_msg(StatusCode::BAD_REQUEST, "ANTHROPIC_API_KEY is missing");
        }
        return anthropic(app, req, model, id, started, stream, key_id).await;
    }
    if app.openai_key.is_empty() {
        app.note(&id, &model, vendor, started, 400, stream, 0, 0, Some("OPENAI_API_KEY is missing".into()), &key_id);
        return json_msg(StatusCode::BAD_REQUEST, "OPENAI_API_KEY is missing");
    }
    openai(app, req, model, id, started, stream, key_id).await
}

async fn openai(app: App, req: ChatReq, model: String, id: String, started: Instant, stream: bool, key_id: String) -> Response {
    let key = app.openai_key.clone();
    let sent = match app
        .client
        .post(OPENAI_URL)
        .bearer_auth(key)
        .json(&openai_body(&req))
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(err) => {
            let message = err.to_string();
            app.note(&id, &model, "openai", started, 502, stream, 0, 0, Some(message.clone()), &key_id);
            return json_msg(StatusCode::BAD_GATEWAY, &message);
        }
    };
    if stream && sent.status().is_success() {
        return stream_openai(app, sent, id, model, started, key_id);
    }
    let status = sent.status();
    let bytes = match sent.bytes().await {
        Ok(bytes) => bytes,
        Err(err) => {
            let message = err.to_string();
            app.note(&id, &model, "openai", started, 502, stream, 0, 0, Some(message.clone()), &key_id);
            return json_msg(StatusCode::BAD_GATEWAY, &message);
        }
    };
    let (tokens_in, tokens_out) = serde_json::from_slice::<Value>(&bytes).map(|v| usage_of(&v)).unwrap_or((0, 0));
    let error = if status.is_success() { None } else { Some(error_snippet(&bytes)) };
    app.note(&id, &model, "openai", started, status.as_u16(), stream, tokens_in, tokens_out, error, &key_id);
    let media = if stream { "text/event-stream" } else { "application/json" };
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, media)
        .body(Body::from(bytes))
        .unwrap_or_else(|_| Response::new(Body::from("")))
}

fn stream_openai(app: App, resp: reqwest::Response, id: String, model: String, started: Instant, key_id: String) -> Response {
    let status = resp.status().as_u16();
    let body = stream! {
        let mut mark = Mark { app, done: false, id, model, vendor: "openai".into(), started, stream: true, key_id };
        let mut upstream = resp.bytes_stream();
        let mut failed = false;
        while let Some(item) = upstream.next().await {
            match item {
                Ok(chunk) => yield Ok::<Bytes, std::io::Error>(chunk),
                Err(err) => {
                    mark.finish(false, 502, 0, 0, Some(err.to_string()));
                    failed = true;
                    break;
                }
            }
        }
        if !failed {
            mark.finish(true, status, 0, 0, None);
        }
    };
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/event-stream")
        .header(header::CACHE_CONTROL, "no-cache")
        .body(Body::from_stream(body))
        .unwrap_or_else(|_| Response::new(Body::from("")))
}

async fn anthropic(app: App, req: ChatReq, model: String, id: String, started: Instant, stream: bool, key_id: String) -> Response {
    let key = app.anthropic_key.clone();
    let sent = match app
        .client
        .post(ANTHROPIC_URL)
        .header("x-api-key", key)
        .header("anthropic-version", "2023-06-01")
        .json(&to_anthropic(&req))
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(err) => {
            let message = err.to_string();
            app.note(&id, &model, "anthropic", started, 502, stream, 0, 0, Some(message.clone()), &key_id);
            return json_msg(StatusCode::BAD_GATEWAY, &message);
        }
    };
    if !sent.status().is_success() {
        let status = sent.status();
        let bytes = match sent.bytes().await {
            Ok(bytes) => bytes,
            Err(err) => {
                let message = err.to_string();
                app.note(&id, &model, "anthropic", started, 502, stream, 0, 0, Some(message.clone()), &key_id);
                return json_msg(StatusCode::BAD_GATEWAY, &message);
            }
        };
        app.note(&id, &model, "anthropic", started, status.as_u16(), stream, 0, 0, Some(error_snippet(&bytes)), &key_id);
        return Response::builder()
            .status(status)
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(bytes))
            .unwrap_or_else(|_| Response::new(Body::from("")));
    }
    if stream {
        return stream_anthropic(app, sent, id, model, started, key_id);
    }
    let bytes = match sent.bytes().await {
        Ok(bytes) => bytes,
        Err(err) => {
            let message = err.to_string();
            app.note(&id, &model, "anthropic", started, 502, false, 0, 0, Some(message.clone()), &key_id);
            return json_msg(StatusCode::BAD_GATEWAY, &message);
        }
    };
    let parsed = match serde_json::from_slice::<Value>(&bytes) {
        Ok(v) => v,
        Err(_) => {
            app.note(&id, &model, "anthropic", started, 502, false, 0, 0, Some("invalid upstream json".into()), &key_id);
            return json_msg(StatusCode::BAD_GATEWAY, "invalid upstream json");
        }
    };
    let shaped = from_anthropic(&parsed, &model);
    let (tokens_in, tokens_out) = usage_of(&shaped);
    app.note(&id, &model, "anthropic", started, 200, false, tokens_in, tokens_out, None, &key_id);
    Response::builder()
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(shaped.to_string()))
        .unwrap_or_else(|_| Response::new(Body::from("")))
}

fn stream_anthropic(app: App, resp: reqwest::Response, id: String, model: String, started: Instant, key_id: String) -> Response {
    let body = stream! {
        let mut mark = Mark { app, done: false, id: id.clone(), model: model.clone(), vendor: "anthropic".into(), started, stream: true, key_id };
        let mut upstream = resp.bytes_stream();
        let mut buf = String::new();
        let mut failed = false;
        while let Some(item) = upstream.next().await {
            let chunk = match item {
                Ok(chunk) => chunk,
                Err(err) => {
                    mark.finish(false, 502, 0, 0, Some(err.to_string()));
                    failed = true;
                    break;
                }
            };
            buf.push_str(&String::from_utf8_lossy(&chunk));
            while let Some(idx) = buf.find('\n') {
                let line = buf.drain(..=idx).collect::<String>();
                if let Some(text) = sse_piece(line.trim_end_matches(['\n', '\r'])) {
                    yield Ok::<Bytes, std::io::Error>(Bytes::from(chunk_line(&id, &model, &text)));
                }
            }
        }
        if !failed {
            if let Some(text) = sse_piece(buf.trim()) {
                yield Ok::<Bytes, std::io::Error>(Bytes::from(chunk_line(&id, &model, &text)));
            }
            mark.finish(true, 200, 0, 0, None);
            yield Ok::<Bytes, std::io::Error>(Bytes::from("data: [DONE]\n\n"));
        }
    };
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/event-stream")
        .header(header::CACHE_CONTROL, "no-cache")
        .body(Body::from_stream(body))
        .unwrap_or_else(|_| Response::new(Body::from("")))
}

fn router(app: App) -> Router {
    let layer_app = app.clone();
    Router::new()
        .route("/", get(dashboard))
        .route("/keys", get(keys_page))
        .route("/troubleshoot", get(troubleshoot))
        .route("/setup", get(setup_page).post(setup_mint))
        .route("/health", get(health))
        .route("/v1/models", get(models))
        .route("/v1/chat/completions", post(chat))
        .route("/api/stats", get(stats))
        .route("/api/keys", post(mint_key))
        .route("/api/keys/:id", patch(tune_key).delete(revoke_key))
        .layer(from_fn_with_state(layer_app, guard))
        .with_state(app)
}

async fn guard(State(app): State<App>, req: Request<Body>, next: Next) -> Response {
    let peer = req.extensions().get::<ConnectInfo<SocketAddr>>().map(|c| c.0);
    if !peer.is_some_and(|addr| access::ip_allowed(addr.ip(), &app.allow)) {
        return json_msg(StatusCode::FORBIDDEN, "address not allowed");
    }
    let origin = req.headers().get(header::ORIGIN).and_then(|v| v.to_str().ok());
    if !access::origin_allowed(origin, &app.cors) {
        return json_msg(StatusCode::FORBIDDEN, "origin not allowed");
    }
    let path = req.uri().path().to_string();
    let mut res = next.run(req).await;
    let headers = res.headers_mut();
    headers.insert(header::X_CONTENT_TYPE_OPTIONS, "nosniff".parse().unwrap());
    headers.insert(header::X_FRAME_OPTIONS, "DENY".parse().unwrap());
    if path.starts_with("/api/") {
        headers.insert(header::CACHE_CONTROL, "no-store".parse().unwrap());
    }
    res
}

async fn setup_page(State(app): State<App>, ConnectInfo(peer): ConnectInfo<SocketAddr>, headers: HeaderMap) -> Response {
    if !setup_ok(&app, peer, Some(&headers)) {
        return json_msg(StatusCode::NOT_FOUND, "setup closed");
    }
    html_page(SETUP)
}

async fn setup_mint(State(app): State<App>, ConnectInfo(peer): ConnectInfo<SocketAddr>, headers: HeaderMap) -> Response {
    if !setup_ok(&app, peer, Some(&headers)) {
        return json_msg(StatusCode::NOT_FOUND, "setup closed");
    }
    match app.vault.mint("personal", 30, 200_000) {
        Ok(secret) => Json(json!({
            "id": "personal",
            "key": secret,
            "base_url": format!("http://{}/v1", app.bind),
        }))
        .into_response(),
        Err(err) => json_msg(StatusCode::BAD_REQUEST, &err),
    }
}

fn setup_ok(app: &App, peer: SocketAddr, headers: Option<&HeaderMap>) -> bool {
    if !peer.ip().is_loopback() {
        return false;
    }
    if !app.vault.edge_ok(&format!("setup:{}", peer.ip()), 8) {
        return false;
    }
    if !app.setup_token.is_empty() {
        let Some(headers) = headers else {
            return true;
        };
        let got = headers.get("x-setup-token").and_then(|v| v.to_str().ok()).unwrap_or("");
        return access::ct_eq(got, &app.setup_token);
    }
    app.vault.setup_open()
}

async fn mint_key(State(app): State<App>, headers: HeaderMap, Query(query): Query<DashQuery>, body: Bytes) -> Response {
    if !dashboard_ok(&app, &headers, &query) {
        return json_msg(StatusCode::UNAUTHORIZED, "dashboard unauthorized");
    }
    let req: Value = serde_json::from_slice(&body).unwrap_or_else(|_| json!({}));
    let id = req["id"].as_str().unwrap_or("agent");
    let rpm = req["rpm"].as_u64().unwrap_or(30) as u32;
    let daily = req["daily_tokens"].as_u64().unwrap_or(200_000);
    match app.vault.mint(id, rpm, daily) {
        Ok(secret) => Json(json!({
            "id": id,
            "key": secret,
            "snippet": format!("OPENAI_BASE_URL=http://{}/v1\nOPENAI_API_KEY={secret}", app.bind),
        }))
        .into_response(),
        Err(err) => json_msg(StatusCode::BAD_REQUEST, &err),
    }
}

async fn tune_key(State(app): State<App>, headers: HeaderMap, Query(query): Query<DashQuery>, axum::extract::Path(id): axum::extract::Path<String>, body: Bytes) -> Response {
    if !dashboard_ok(&app, &headers, &query) {
        return json_msg(StatusCode::UNAUTHORIZED, "dashboard unauthorized");
    }
    let req: Value = serde_json::from_slice(&body).unwrap_or_else(|_| json!({}));
    let rpm = req["rpm"].as_u64().unwrap_or(30) as u32;
    let daily = req["daily_tokens"].as_u64().unwrap_or(0);
    match app.vault.set_limits(&id, rpm, daily) {
        Ok(()) => Json(json!({"id": id, "rpm": rpm.max(1), "daily_tokens": daily})).into_response(),
        Err(err) => json_msg(StatusCode::BAD_REQUEST, &err),
    }
}

async fn revoke_key(State(app): State<App>, headers: HeaderMap, Query(query): Query<DashQuery>, axum::extract::Path(id): axum::extract::Path<String>) -> Response {
    if !dashboard_ok(&app, &headers, &query) {
        return json_msg(StatusCode::UNAUTHORIZED, "dashboard unauthorized");
    }
    match app.vault.revoke(&id) {
        Ok(()) => Json(json!({"revoked": id})).into_response(),
        Err(err) => json_msg(StatusCode::BAD_REQUEST, &err),
    }
}

fn loopback(host: &str) -> bool {
    host == "127.0.0.1" || host == "localhost" || host == "::1"
}

#[tokio::main]
async fn main() {
    match dotenvy::dotenv() {
        Ok(_) => {}
        Err(err) if err.not_found() => {}
        Err(err) => eprintln!("dotenv: {err}"),
    }
    let gateway_key = std::env::var("GATEWAY_BOOTSTRAP_KEY")
        .or_else(|_| std::env::var("GATEWAY_API_KEY"))
        .unwrap_or_default();
    if gateway_key == "sk-gateway-change-me" {
        eprintln!("warning: GATEWAY_BOOTSTRAP_KEY is still the example value");
    }
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".into());
    let allow_lan = std::env::var("ALLOW_LAN").unwrap_or_default() == "1";
    let keys_file = std::env::var("KEYS_FILE").unwrap_or_else(|_| "keys.json".into());
    let vault = Arc::new(access::Vault::load(keys_file.into(), &gateway_key));
    if !loopback(&host) && !(allow_lan && vault.any()) {
        eprintln!("refusing bind {host}: set ALLOW_LAN=1 and at least one gateway key");
        std::process::exit(1);
    }
    let port: u16 = std::env::var("PORT").ok().filter(|s| !s.is_empty()).and_then(|s| s.parse().ok()).unwrap_or(8787);
    let dashboard_token = match std::env::var("DASHBOARD_TOKEN") {
        Ok(value) if !value.is_empty() => value,
        _ => {
            let token = access::random_secret("dash-");
            eprintln!("DASHBOARD_TOKEN (shown once): {token}");
            token
        }
    };
    let connect_timeout = env_secs("CONNECT_TIMEOUT", 8);
    let read_timeout = env_secs("READ_TIMEOUT", 60);
    let client = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(connect_timeout))
        .read_timeout(Duration::from_secs(read_timeout))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .expect("http client");
    let app = App {
        client,
        openai_key: std::env::var("OPENAI_API_KEY").unwrap_or_default(),
        anthropic_key: std::env::var("ANTHROPIC_API_KEY").unwrap_or_default(),
        dashboard_token,
        setup_token: std::env::var("SETUP_TOKEN").unwrap_or_default(),
        bind: format!("{host}:{port}"),
        started: Instant::now(),
        stats: Arc::new(Mutex::new(Stats::default())),
        vault,
        allow: access::parse_nets(&std::env::var("ALLOWLIST").unwrap_or_default()),
        cors: std::env::var("CORS_ORIGINS").unwrap_or_default().split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect(),
    };
    let addr = format!("{host}:{port}");
    let listener = tokio::net::TcpListener::bind(&addr).await.expect("bind");
    eprintln!("dashboard http://{addr}/");
    eprintln!("health    curl -s http://{addr}/health");
    axum::serve(listener, router(app).into_make_service_with_connect_info::<SocketAddr>()).await.expect("serve");
}

const DASHBOARD: &str = include_str!("dashboard.html");
const TROUBLESHOOT: &str = include_str!("troubleshoot.html");
const SETUP: &str = include_str!("setup.html");
const KEYS_PAGE: &str = include_str!("keys.html");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn routes_and_masks() {
        assert_eq!(vendor_of("Claude-Sonnet"), "anthropic");
        assert_eq!(vendor_of("anthropic.claude"), "anthropic");
        assert_eq!(vendor_of("gpt-4o-mini"), "openai");
        assert_eq!(mask_key(""), "—");
        assert_eq!(mask_key("short"), "…");
        assert_eq!(mask_key("sk-proj-1234567890abcd"), "sk-proj…abcd");
    }

    #[test]
    fn anthropic_shape() {
        let req = ChatReq {
            model: Some("claude-sonnet-4-6".into()),
            messages: Some(vec![
                json!({"role":"system","content":"brief"}),
                json!({"role":"user","content":[{"type":"text","text":"ping"}]}),
            ]),
            stream: Some(false),
            temperature: Some(json!(0.2)),
            max_tokens: None,
            tools: Some(json!([])),
            tool_choice: None,
            response_format: None,
            top_p: None,
            max_completion_tokens: None,
        };
        let body = to_anthropic(&req);
        assert_eq!(body["system"], "brief");
        assert_eq!(body["max_tokens"], 4096);
        assert_eq!(body["messages"][0]["content"], "ping");
        assert!(body.get("tools").is_none());
        let shaped = from_anthropic(
            &json!({"id":"msg_1","content":[{"type":"text","text":"pong"}],"usage":{"input_tokens":3,"output_tokens":1}}),
            "claude-sonnet-4-6",
        );
        assert_eq!(shaped["object"], "chat.completion");
        assert_eq!(shaped["choices"][0]["message"]["content"], "pong");
        assert_eq!(shaped["usage"]["total_tokens"], 4);
        let line = "data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"pong\"}}";
        assert_eq!(sse_piece(line).as_deref(), Some("pong"));
    }
}
