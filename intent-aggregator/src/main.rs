mod decide;
mod jev;
mod questions;

use serde_json::{json, Value};
use tiny_http::{Header, Method, Response, Server, StatusCode};

use crate::decide::suggested_action;
use crate::jev::call_jev;
use crate::questions::Scenario;

const INDEX: &str = include_str!("../static/index.html");
const MAX_TEXT: usize = 8000;

fn header(name: &str, value: &str) -> Header {
    Header::from_bytes(name.as_bytes(), value.as_bytes()).expect("header")
}

fn json_response(status: u16, body: Value) -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_string(body.to_string())
        .with_status_code(StatusCode(status))
        .with_header(header("Content-Type", "application/json"))
}

fn public_error(code: &str) -> (u16, &'static str) {
    match code {
        "bad_scenario" => (400, "scenario must be customer, meeting, or ticket"),
        "empty_text" => (400, "text is empty"),
        "text_too_long" => (400, "text is too long"),
        "invalid_json" => (400, "body must be JSON"),
        _ => (500, "Jev returned an unexpected body"),
    }
}

fn analyze(body: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let parsed: Value = match serde_json::from_str(body) {
        Ok(value) => value,
        Err(_) => {
            let (status, message) = public_error("invalid_json");
            return json_response(status, json!({ "error": message }));
        }
    };
    let scenario = parsed
        .get("scenario")
        .and_then(Value::as_str)
        .and_then(Scenario::parse);
    let Some(scenario) = scenario else {
        let (status, message) = public_error("bad_scenario");
        return json_response(status, json!({ "error": message }));
    };
    let text = parsed.get("text").and_then(Value::as_str).unwrap_or("").trim();
    if text.is_empty() {
        let (status, message) = public_error("empty_text");
        return json_response(status, json!({ "error": message }));
    }
    if text.len() > MAX_TEXT {
        let (status, message) = public_error("text_too_long");
        return json_response(status, json!({ "error": message }));
    }

    match call_jev(scenario, text) {
        Ok(answers) => {
            let map: serde_json::Map<String, Value> = answers.clone().into_iter().collect();
            let action = suggested_action(scenario, &map);
            json_response(
                200,
                json!({
                    "answers": answers,
                    "suggested_action": action,
                }),
            )
        }
        Err(error) => {
            let (status, message) = error.public_pair();
            eprintln!("[intent] status {status}");
            json_response(status, json!({ "error": message }))
        }
    }
}

fn main() {
    let port = std::env::var("PORT").unwrap_or_else(|_| "8788".into());
    let addr = format!("127.0.0.1:{port}");
    let server = Server::http(&addr).unwrap_or_else(|error| panic!("listen {addr}: {error}"));
    eprintln!("intent-aggregator http://{addr}");
    for mut request in server.incoming_requests() {
        let response = match (request.method(), request.url()) {
            (Method::Get, "/") => Response::from_string(INDEX)
                .with_header(header("Content-Type", "text/html; charset=utf-8")),
            (Method::Post, "/api/analyze") => {
                let mut body = String::new();
                let _ = request.as_reader().read_to_string(&mut body);
                analyze(&body)
            }
            _ => json_response(404, json!({ "error": "not found" })),
        };
        let _ = request.respond(response);
    }
}
