use serde::Deserialize;
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Clone)]
pub struct PollConfig {
    pub url: String,
    pub interval: Duration,
    pub max_attempts: u32,
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
pub struct SlotStatus {
    pub open: bool,
    pub earliest: Option<String>,
}

#[derive(Debug, Error)]
pub enum PollError {
    #[error("http: {0}")]
    Http(#[from] reqwest::Error),
    #[error("no open slot after {0} attempts")]
    Exhausted(u32),
    #[error("url must be http://127.0.0.1 or http://localhost")]
    NotLoopback,
}

fn require_loopback(url: &str) -> Result<(), PollError> {
    let rest = url
        .strip_prefix("http://")
        .ok_or(PollError::NotLoopback)?;
    let host = rest.split(['/', ':']).next().unwrap_or("");
    if host == "127.0.0.1" || host == "localhost" {
        Ok(())
    } else {
        Err(PollError::NotLoopback)
    }
}

pub async fn fetch_status(client: &reqwest::Client, url: &str) -> Result<SlotStatus, PollError> {
    require_loopback(url)?;
    let resp = client.get(url).send().await?.error_for_status()?;
    Ok(resp.json().await?)
}

/// Read-only poll. Returns when `open` is true. Does not submit a form.
pub async fn poll_until_open(
    client: &reqwest::Client,
    cfg: &PollConfig,
) -> Result<SlotStatus, PollError> {
    require_loopback(&cfg.url)?;
    for i in 1..=cfg.max_attempts {
        let status = fetch_status(client, &cfg.url).await?;
        if status.open {
            return Ok(status);
        }
        if i < cfg.max_attempts {
            tokio::time::sleep(cfg.interval).await;
        }
    }
    Err(PollError::Exhausted(cfg.max_attempts))
}
