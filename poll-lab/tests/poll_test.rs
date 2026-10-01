use poll_lab::{fetch_status, poll_until_open, PollConfig};
use std::time::Duration;
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

#[tokio::test]
async fn parses_closed_json() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/status"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(
            r#"{"open":false,"earliest":null}"#,
            "application/json",
        ))
        .mount(&server)
        .await;

    let client = reqwest::Client::new();
    let url = format!("{}/status", server.uri());
    let s = fetch_status(&client, &url).await.unwrap();
    assert!(!s.open);
    assert!(s.earliest.is_none());
}

#[tokio::test]
async fn poll_sees_open_on_second_try() {
    let server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/status"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(
            r#"{"open":false,"earliest":null}"#,
            "application/json",
        ))
        .up_to_n_times(1)
        .mount(&server)
        .await;

    Mock::given(method("GET"))
        .and(path("/status"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(
            r#"{"open":true,"earliest":"2026-10-01"}"#,
            "application/json",
        ))
        .mount(&server)
        .await;

    let client = reqwest::Client::new();
    let cfg = PollConfig {
        url: format!("{}/status", server.uri()),
        interval: Duration::from_millis(10),
        max_attempts: 3,
    };
    let s = poll_until_open(&client, &cfg).await.unwrap();
    assert!(s.open);
    assert_eq!(s.earliest.as_deref(), Some("2026-10-01"));
}

#[tokio::test]
async fn poll_exhausted() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/status"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(
            r#"{"open":false,"earliest":null}"#,
            "application/json",
        ))
        .mount(&server)
        .await;

    let client = reqwest::Client::new();
    let cfg = PollConfig {
        url: format!("{}/status", server.uri()),
        interval: Duration::from_millis(5),
        max_attempts: 2,
    };
    let err = poll_until_open(&client, &cfg).await.unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("no open slot"));
}

#[tokio::test]
async fn rejects_public_host() {
    let client = reqwest::Client::new();
    let err = fetch_status(&client, "https://example.com/status")
        .await
        .unwrap_err();
    assert!(err.to_string().contains("127.0.0.1"));
}
