use std::collections::HashMap;
use std::time::Duration;

use serde::Serialize;
use serde_json::Value;

use crate::questions::Question;

const ATTEMPTS: u32 = 3;

#[derive(Serialize)]
struct JevRequest<'a, S: Serialize> {
    state: &'a S,
    model: &'static str,
    questions: &'a indexmap::IndexMap<&'static str, Question>,
}

pub enum JevError {
    MissingKey,
    BadKey,
    BadBody,
    Busy,
    Unreachable,
    BadUpstream,
}

impl JevError {
    pub fn public_pair(&self) -> (u16, &'static str) {
        match self {
            Self::MissingKey => (503, "TYPESAFE_API_KEY is not set"),
            Self::BadKey => (401, "Jev rejected the key"),
            Self::BadBody => (422, "Jev rejected the question body"),
            Self::Busy => (502, "Jev is busy"),
            Self::Unreachable => (502, "Jev is unreachable"),
            Self::BadUpstream => (502, "Jev returned an unexpected body"),
        }
    }
}

pub async fn call_jev<S: Serialize>(
    state: &S,
    questions: &indexmap::IndexMap<&'static str, Question>,
) -> Result<HashMap<String, Value>, JevError> {
    let key = std::env::var("TYPESAFE_API_KEY").map_err(|_| JevError::MissingKey)?;
    let body = JevRequest {
        state,
        model: "jev-latest",
        questions,
    };
    let client = reqwest::Client::builder()
        .build()
        .map_err(|_| JevError::Unreachable)?;

    let mut delay = Duration::from_millis(250);
    for attempt in 1..=ATTEMPTS {
        let response = client
            .post("https://api.typesafe.ai/v1/systemone")
            .bearer_auth(&key)
            .json(&body)
            .send()
            .await;
        let response = match response {
            Ok(response) => response,
            Err(_) => return Err(JevError::Unreachable),
        };
        let status = response.status().as_u16();
        if response.status().is_success() {
            let parsed: Value = response.json().await.map_err(|_| JevError::BadUpstream)?;
            let answers = parsed
                .get("answers")
                .and_then(Value::as_object)
                .cloned()
                .ok_or(JevError::BadUpstream)?;
            return Ok(answers.into_iter().collect());
        }
        let _ = response.text().await;
        if (status == 429 || status == 529) && attempt < ATTEMPTS {
            tokio::time::sleep(delay).await;
            delay *= 2;
            continue;
        }
        return Err(match status {
            401 => JevError::BadKey,
            422 => JevError::BadBody,
            429 | 529 => JevError::Busy,
            _ => JevError::BadUpstream,
        });
    }
    Err(JevError::Busy)
}
