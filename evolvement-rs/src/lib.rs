pub mod agent;
pub mod cell;
pub mod forge;
pub mod vm;
pub mod config;
pub mod error;
pub mod github;
pub mod memory;
pub mod sell;
pub mod visitor;

use std::path::Path;
use std::sync::Arc;

use axum::extract::{Path as UrlPath, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::agent::{turn, TurnOut};

pub use crate::config::Config;
use crate::github::digest;
use crate::memory::dream;
use crate::memory::soft::{DownSoft, RedisSoft, SoftStore, Visitor};

#[derive(Clone)]
pub struct AppState {
    pub brain: std::path::PathBuf,
    pub cells: std::path::PathBuf,
    pub soft: Arc<dyn SoftStore>,
}

pub fn state_from_config(cfg: &Config) -> AppState {
    let soft: Arc<dyn SoftStore> = if let Some(url) = &cfg.redis_url {
        Arc::new(RedisSoft::new(url.clone()))
    } else {
        Arc::new(DownSoft)
    };
    AppState {
        brain: cfg.brain.clone(),
        cells: cfg.cells.clone(),
        soft,
    }
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(healthz))
        .route("/v1/turn", post(post_turn))
        .route("/v1/visitor/:id", get(get_visitor))
        .route("/v1/evolvement", get(get_evolvement))
        .route("/v1/forge", post(post_forge))
        .with_state(state)
}

async fn healthz() -> &'static str {
    "ok"
}

#[derive(Deserialize)]
struct ForgeIn {
    task_id: String,
    repo_url: String,
    task: String,
    #[serde(default)]
    files: Vec<String>,
    #[serde(default)]
    commands: Vec<String>,
    #[serde(default)]
    writes: Vec<String>,
}

async fn post_forge(Json(body): Json<ForgeIn>) -> Json<crate::forge::ForgePlan> {
    Json(crate::forge::plan(
        &body.task_id,
        &body.repo_url,
        &body.task,
        &body.files,
        &body.commands,
        &body.writes,
    ))
}

#[derive(Deserialize)]
struct TurnIn {
    #[serde(default)]
    visitor_id: String,
    message: String,
    #[serde(default)]
    prior_topics: Vec<String>,
    #[serde(default = "default_mode")]
    agent_mode: String,
}

fn default_mode() -> String {
    "public".into()
}

#[derive(Serialize)]
struct TurnJson {
    reply: String,
    route: String,
    tools_used: Vec<crate::agent::ToolUse>,
    soft_patch: Option<serde_json::Value>,
}

impl From<TurnOut> for TurnJson {
    fn from(t: TurnOut) -> Self {
        Self {
            reply: t.reply,
            route: t.route,
            tools_used: t.tools_used,
            soft_patch: t.soft_patch,
        }
    }
}

async fn post_turn(State(st): State<AppState>, Json(body): Json<TurnIn>) -> Json<TurnJson> {
    let out = turn(
        &st.brain,
        &st.soft,
        &body.visitor_id,
        &body.message,
        &body.prior_topics,
        &body.agent_mode,
        &st.cells,
    )
    .await;
    Json(out.into())
}

async fn get_visitor(State(st): State<AppState>, UrlPath(id): UrlPath<String>) -> Json<serde_json::Value> {
    match st.soft.load(&id).await {
        Ok(Some(v)) => Json(serde_json::to_value(v).unwrap_or(serde_json::json!({"id": id}))),
        Ok(None) => Json(serde_json::json!({"id": id, "missing": true})),
        Err(_) => Json(serde_json::json!({"id": id, "degraded": true})),
    }
}

async fn get_evolvement(State(st): State<AppState>) -> Json<serde_json::Value> {
    let dream = dream::latest_dream(&st.brain)
        .map(|(date, line)| serde_json::json!({"date": date, "line": line}))
        .unwrap_or(serde_json::json!(null));
    Json(serde_json::json!({
        "dream": dream,
        "harvest_at": digest::harvest_at(&st.brain),
        "harvest_repos": digest::counted(&st.brain),
        "top": digest::top_titles(&st.brain, 3),
        "voice": "third-person",
    }))
}

pub fn open_soft(cfg: &Config) -> Arc<dyn SoftStore> {
    state_from_config(cfg).soft
}

pub async fn run_harvest(cfg: &Config, star: bool) -> crate::error::EvolResult<std::path::PathBuf> {
    digest::harvest(
        &cfg.brain,
        cfg.github_token.as_deref(),
        cfg.watchlist_raw.as_deref(),
        star,
    )
    .await
}

pub fn run_dream(brain: &Path) -> crate::error::EvolResult<std::path::PathBuf> {
    dream::dream(brain)
}

pub fn run_promote(
    cfg: &Config,
    file: &Path,
    dest_name: &str,
) -> crate::error::EvolResult<std::path::PathBuf> {
    dream::promote(
        &cfg.brain,
        file,
        dest_name,
        cfg.promote_allow || human_brain(&cfg.brain),
    )
}

fn human_brain(brain: &Path) -> bool {
    brain.to_string_lossy().contains("aileena_second_brain")
}

#[allow(dead_code)]
fn _visitor_ty(v: Visitor) -> Visitor {
    v
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::memory::soft::{soft_patch, DownSoft, Visitor};
    use axum::body::Body;
    use http_body_util::BodyExt;
    use std::fs;
    use tower::ServiceExt;

    #[test]
    fn soft_patch_never_writes_memories() {
        let brain = std::env::temp_dir().join(format!("evo-soft-{}", uuid::Uuid::new_v4().simple()));
        fs::create_dir_all(brain.join("memories/semantic")).unwrap();
        let pin = brain.join("memories/semantic/music-taste.md");
        fs::write(&pin, "hard pin\n").unwrap();
        let before = fs::read(&pin).unwrap();
        let mut visitor = Visitor::new("vis_test");
        visitor.topics.push("solana".into());
        let patch = soft_patch(&visitor);
        assert_eq!(patch["topics"][0], "solana");
        assert_eq!(fs::read(&pin).unwrap(), before);
        assert!(fs::read_dir(brain.join("memories")).unwrap().count() >= 1);
        let _ = fs::remove_dir_all(&brain);
    }

    #[tokio::test]
    async fn redis_down_turn_is_200() {
        let brain = std::env::temp_dir().join(format!("evo-http-{}", uuid::Uuid::new_v4().simple()));
        fs::create_dir_all(brain.join("memories/semantic")).unwrap();
        fs::write(brain.join("memories/semantic/latest-content.md"), "generatedAt: 2026-09-22\n").unwrap();
        let app = router(AppState {
            brain: brain.clone(),
            cells: std::env::temp_dir().join("evo-cells"),
            soft: Arc::new(DownSoft),
        });
        let req = axum::http::Request::builder()
            .method("POST")
            .uri("/v1/turn")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"visitor_id":"vis_z","message":"更新了什么吗","prior_topics":[]}"#))
            .unwrap();
        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), 200);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["route"], "latest_updates");
        assert_eq!(v["tools_used"][0]["args"], "latest content");
        assert!(v["soft_patch"].is_object());
        let _ = fs::remove_dir_all(&brain);
    }
}
