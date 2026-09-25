use chrono::{Duration, Utc};

use crate::error::{EvolError, EvolResult};
use crate::github::watchlist::{score_row, RepoRow, WatchRepo};

pub struct LiveRepo {
    pub stars: u64,
    pub license: String,
    pub pushed_at: String,
    pub commits_page: u32,
}

pub async fn fetch_repo(token: &str, slug: &str) -> EvolResult<LiveRepo> {
    let Some((owner, name)) = slug.split_once('/') else {
        return Err(EvolError::BadPath(slug.into()));
    };
    let crab = octocrab::Octocrab::builder()
        .personal_token(token.to_string())
        .build()
        .map_err(|e| EvolError::Msg(e.to_string()))?;
    let repo = crab
        .repos(owner, name)
        .get()
        .await
        .map_err(|e| EvolError::Msg(e.to_string()))?;
    let since = Utc::now() - Duration::days(30);
    let page = crab
        .repos(owner, name)
        .list_commits()
        .since(since)
        .per_page(30)
        .send()
        .await
        .map_err(|e| EvolError::Msg(e.to_string()))?;
    let license = repo
        .license
        .map(|l| l.spdx_id)
        .unwrap_or_else(|| "unknown".into());
    let pushed_at = repo
        .pushed_at
        .map(|t| t.to_rfc3339())
        .unwrap_or_else(|| "unknown".into());
    Ok(LiveRepo {
        stars: repo.stargazers_count.unwrap_or(0) as u64,
        license,
        pushed_at,
        commits_page: page.items.len() as u32,
    })
}

pub fn row_from_watch(repo: &WatchRepo, live: Option<LiveRepo>) -> RepoRow {
    match live {
        Some(live) => {
            let recent = live.pushed_at != "unknown";
            RepoRow {
                score: score_row(repo.relevance, &live.license, recent, live.commits_page),
                slug: repo.slug.clone(),
                stars: live.stars,
                license: live.license,
                pushed_at: live.pushed_at,
                commits_page: live.commits_page,
                why: repo.why.into(),
                note: "github live".into(),
                star_ok: repo.star_ok,
                starred: false,
            }
        }
        None => RepoRow {
            score: score_row(repo.relevance, "unknown", false, 0),
            slug: repo.slug.clone(),
            stars: 0,
            license: "unknown".into(),
            pushed_at: "not-fetched".into(),
            commits_page: 0,
            why: repo.why.into(),
            note: "offline watchlist weight; no GITHUB_TOKEN".into(),
            star_ok: repo.star_ok,
            starred: false,
        },
    }
}

fn crab(token: &str) -> EvolResult<octocrab::Octocrab> {
    octocrab::Octocrab::builder()
        .personal_token(token.to_string())
        .build()
        .map_err(|e| EvolError::Msg(e.to_string()))
}

pub async fn already_starred(token: &str, slug: &str) -> EvolResult<bool> {
    let Some((owner, name)) = slug.split_once('/') else {
        return Err(EvolError::BadPath(slug.into()));
    };
    let crab = crab(token)?;
    let response = crab
        ._get(format!("/user/starred/{owner}/{name}"))
        .await
        .map_err(|e| EvolError::Msg(e.to_string()))?;
    Ok(response.status().as_u16() == 204)
}

/// Star and watch only when the caller already decided `should_star`.
pub async fn star_and_watch(token: &str, slug: &str) -> EvolResult<()> {
    let Some((owner, name)) = slug.split_once('/') else {
        return Err(EvolError::BadPath(slug.into()));
    };
    let crab = crab(token)?;
    let starred = crab
        ._put(format!("/user/starred/{owner}/{name}"), None::<&()>)
        .await
        .map_err(|e| EvolError::Msg(e.to_string()))?;
    if !starred.status().is_success() {
        return Err(EvolError::Msg(format!("star {slug} http {}", starred.status())));
    }
    let body = serde_json::json!({"subscribed": true, "ignored": false});
    let watched = crab
        ._put(format!("/repos/{owner}/{name}/subscription"), Some(&body))
        .await
        .map_err(|e| EvolError::Msg(e.to_string()))?;
    if !watched.status().is_success() {
        return Err(EvolError::Msg(format!("watch {slug} http {}", watched.status())));
    }
    Ok(())
}

pub async fn latest_release(token: &str, slug: &str) -> EvolResult<Option<String>> {
    let Some((owner, name)) = slug.split_once('/') else {
        return Err(EvolError::BadPath(slug.into()));
    };
    let crab = crab(token)?;
    let page = crab
        .repos(owner, name)
        .releases()
        .list()
        .per_page(1)
        .send()
        .await
        .map_err(|e| EvolError::Msg(e.to_string()))?;
    Ok(page.items.first().map(|r| r.tag_name.clone()))
}
