use std::path::Path;
use std::sync::Arc;

use serde::Serialize;

use crate::error::EvolError;
use crate::github::digest;
use crate::memory::index::{self, Index};
use crate::memory::soft::{soft_patch, SoftStore, Visitor};
use crate::sell::pitch::{self, Facts};
use crate::sell::routes::{self, classify, Route};
use crate::visitor::{ensure_id, fold_visitor};

pub const MAX_STEPS: usize = 4;

#[derive(Clone, Debug, Serialize)]
pub struct ToolUse {
    pub name: String,
    pub args: String,
    pub observation: String,
    pub blocked: bool,
}

#[derive(Clone, Debug)]
pub struct TurnOut {
    pub reply: String,
    pub route: String,
    pub tools_used: Vec<ToolUse>,
    pub soft_patch: Option<serde_json::Value>,
    pub visitor: Visitor,
}

pub fn guard_tool(used: &mut Vec<ToolUse>, name: &str, args: &str, observation: String) -> bool {
    if used.iter().any(|t| t.name == name && t.args == args) {
        used.push(ToolUse {
            name: name.into(),
            args: args.into(),
            observation: "blocked duplicate_tool".into(),
            blocked: true,
        });
        return false;
    }
    if used.iter().filter(|t| !t.blocked).count() >= MAX_STEPS {
        used.push(ToolUse {
            name: name.into(),
            args: args.into(),
            observation: "blocked max_steps".into(),
            blocked: true,
        });
        return false;
    }
    used.push(ToolUse {
        name: name.into(),
        args: args.into(),
        observation: index::truncate(&observation, 180),
        blocked: false,
    });
    true
}

pub async fn turn(
    brain: &Path,
    soft: &Arc<dyn SoftStore>,
    visitor_id: &str,
    message: &str,
    prior_topics: &[String],
    agent_mode: &str,
    cells: &Path,
) -> TurnOut {
    let id = ensure_id(visitor_id);
    let loaded = match soft.load(&id).await {
        Ok(v) => v,
        Err(EvolError::RedisDown) => None,
        Err(_) => None,
    };
    let redis_down = soft.load(&id).await.is_err();
    let mut visitor = fold_visitor(loaded, &id, message, prior_topics);
    let route = classify(message);
    let mut tools = Vec::new();
    let first_person = agent_mode == "machina" && matches!(route, Route::Evolvement);
    let reply = match route {
        Route::Hire => "Hire is a static answer. No tools. She takes the work in writing. The room is the CV.".into(),
        Route::Latest => reply_latest(brain, &mut tools, "latest content"),
        Route::Evolvement => {
            let _ = guard_tool(&mut tools, "read_digest", "catalogue/repos-digest.md", digest_obs(brain));
            let facts = Facts::load(brain, &visitor.topics);
            let card = pitch::EvolvementCard::from_facts(&facts);
            visitor.evolvement_pitch_shown = true;
            if let Some(a) = facts.top3.get(0) {
                if !visitor.repos_shown.contains(a) {
                    visitor.repos_shown.push(a.clone());
                }
            }
            if let Some(b) = facts.top3.get(1) {
                if !visitor.repos_shown.contains(b) {
                    visitor.repos_shown.push(b.clone());
                }
            }
            let _ = first_person;
            pitch::pitch(&card, &visitor.lang)
        }
        Route::SoftRecall => {
            let asks = visitor
                .asks
                .iter()
                .rev()
                .take(3)
                .map(|a| a.q.clone())
                .collect::<Vec<_>>()
                .join(" | ");
            let _ = guard_tool(&mut tools, "recall_soft", &id, asks.clone());
            if asks.is_empty() {
                "No soft asks stored. Prior topics from the client still count.".into()
            } else {
                format!("Soft asks on this visitor: {asks}")
            }
        }
        Route::Cell => {
            let work = crate::cell::work_dir(cells, &id);
            if message.contains("开电脑") && !message.starts_with("run ") && !message.starts_with('$') {
                let _ = std::fs::create_dir_all(&work);
                format!("cell {id} desk on {}", work.display())
            } else {
            match crate::cell::exec_in_work(&work, message) {
                Ok(out) => {
                    let _ = guard_tool(&mut tools, "cell_exec", message, out.clone());
                    format!("cell {id} {}\n{out}", work.display())
                }
                Err(err) => format!("cell refused: {err}"),
            }
            }
        }
        Route::Night => {
            "Night desk. Same visitor id, long memory, not a girlfriend SKU. She stays. The diary stays soft. It does not become her taste.".into()
        }
        Route::Forge => {
            let planned = crate::forge::plan("turn", "user-supplied", message, &[], &[], &[]);
            let work = crate::cell::work_dir(cells, &id);
            let written = crate::cell::write_patch(&work, &planned.branch, &planned.pr_body)
                .map(|p| p.display().to_string())
                .unwrap_or_else(|e| e);
            let _ = guard_tool(&mut tools, "forge_plan", "PATCH.md", planned.pr_body.clone());
            format!(
                "Forge wrote {written}. Branch {}. No push to main. No deploy. {}",
                planned.branch,
                planned.blocked_on.unwrap_or_default()
            )
        }
        Route::Repo => {
            let _ = guard_tool(&mut tools, "read_digest", "catalogue/repos-digest.md", digest_obs(brain));
            format!(
                "Watchlist digest, catalogue lane. {} repos. Top: {}.",
                digest::counted(brain),
                digest::top_titles(brain, 3).join(", ")
            )
        }
        Route::Taste => {
            if routes::is_chip_lane(message) {
                "Chip and research PDFs stay in the catalogue lane. Not Dreaming taste.".into()
            } else {
                let idx = Index::build(brain).ok();
                let hits = idx.as_ref().map(|i| i.search(message, 3)).unwrap_or_default();
                let obs = hits
                    .iter()
                    .map(|h| format!("{}: {}", h.path, h.snippet))
                    .collect::<Vec<_>>()
                    .join("\n");
                let _ = guard_tool(&mut tools, "search_hard", message, obs.clone());
                if hits.is_empty() {
                    "No hard pin matched. She does not invent taste.".into()
                } else {
                    format!("Hard pin: {}", hits[0].snippet)
                }
            }
        }
    };
    let patch = if redis_down {
        Some(soft_patch(&visitor))
    } else {
        match soft.save(&visitor).await {
            Ok(()) => None,
            Err(_) => Some(soft_patch(&visitor)),
        }
    };
    TurnOut {
        reply,
        route: route.as_str().into(),
        tools_used: tools,
        soft_patch: patch,
        visitor,
    }
}

fn reply_latest(brain: &Path, tools: &mut Vec<ToolUse>, query: &str) -> String {
    let idx = Index::build(brain).ok();
    let hits = idx.as_ref().map(|i| i.search(query, 3)).unwrap_or_default();
    let obs = hits
        .iter()
        .map(|h| format!("{}: {}", h.path, h.snippet))
        .collect::<Vec<_>>()
        .join("\n");
    let _ = guard_tool(tools, "search_hard", query, obs);
    let date = Facts::load(brain, &[]).latest_date;
    if hits.is_empty() {
        format!("Forced query \"{query}\". Snapshot date {date}. No chunk hit.")
    } else {
        format!("Forced query \"{query}\". Snapshot date {date}. {}", hits[0].snippet)
    }
}

fn digest_obs(brain: &Path) -> String {
    format!(
        "{} repos. {}",
        digest::counted(brain),
        digest::top_titles(brain, 3).join(", ")
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::memory::soft::DownSoft;
    use std::fs;

    fn brain() -> std::path::PathBuf {
        let p = std::env::temp_dir().join(format!("evo-agent-{}", uuid::Uuid::new_v4().simple()));
        fs::create_dir_all(p.join("memories/semantic")).unwrap();
        fs::write(
            p.join("memories/semantic/latest-content.md"),
            "generatedAt: 2026-09-22T06:53:15.787Z\n# Latest content\nlocal models ymtc\n",
        )
        .unwrap();
        fs::write(
            p.join("memories/semantic/music-taste.md"),
            "# pins\nShe likes harder techno.\n",
        )
        .unwrap();
        p
    }

    #[test]
    fn duplicate_tool_blocked() {
        let mut used = Vec::new();
        assert!(guard_tool(&mut used, "search_hard", "latest content", "one".into()));
        assert!(!guard_tool(&mut used, "search_hard", "latest content", "two".into()));
        assert!(used[1].blocked);
        assert!(used[1].observation.contains("duplicate_tool"));
    }

    #[tokio::test]
    async fn chinese_latest_forces_english_query() {
        let brain = brain();
        let soft: Arc<dyn SoftStore> = Arc::new(DownSoft);
        let cells = std::env::temp_dir();
        let out = turn(&brain, &soft, "vis_a", "更新了什么吗", &[], "public", &cells).await;
        assert_eq!(out.route, "latest_updates");
        assert_eq!(out.tools_used[0].name, "search_hard");
        assert_eq!(out.tools_used[0].args, "latest content");
        let _ = fs::remove_dir_all(&brain);
    }

    #[tokio::test]
    async fn hire_uses_no_tools() {
        let brain = brain();
        let soft: Arc<dyn SoftStore> = Arc::new(DownSoft);
        let cells = std::env::temp_dir();
        let out = turn(&brain, &soft, "", "is she available for hire?", &[], "public", &cells).await;
        assert_eq!(out.route, "hire_cv");
        assert!(out.tools_used.is_empty());
        let _ = fs::remove_dir_all(&brain);
    }

    #[tokio::test]
    async fn redis_down_still_returns_turn() {
        let brain = brain();
        let soft: Arc<dyn SoftStore> = Arc::new(DownSoft);
        let cells = std::env::temp_dir();
        let out = turn(&brain, &soft, "vis_x", "hello techno", &["solana".into()], "public", &cells).await;
        assert!(out.soft_patch.is_some());
        assert!(out.reply.len() > 0);
        let _ = fs::remove_dir_all(&brain);
    }
}
