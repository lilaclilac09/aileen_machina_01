use std::fs;
use std::path::{Path, PathBuf};

use crate::error::EvolResult;
use crate::github::client::{already_starred, fetch_repo, latest_release, row_from_watch, star_and_watch};
use crate::github::watchlist::{parse_watchlist, should_star, RepoRow};
use crate::memory::index::Index;

pub fn digest_path(brain: &Path) -> PathBuf {
    brain.join("catalogue").join("repos-digest.md")
}

pub fn render_digest(rows: &[RepoRow]) -> String {
    let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let mut lines = vec![
        format!("# Repo digest {date}"),
        String::new(),
        "Catalogue lane. Not taste. Not Dreaming.".into(),
        format!("Repos scored: {}.", rows.len()),
        String::new(),
        "| repo | score | stars | license | pushed | note |".into(),
        "| --- | --- | --- | --- | --- | --- |".into(),
    ];
    let mut sorted = rows.to_vec();
    sorted.sort_by(|a, b| b.score.cmp(&a.score).then(a.slug.cmp(&b.slug)));
    for row in &sorted {
        lines.push(format!(
            "| {} | {} | {} | {} | {} | {} |",
            row.slug, row.score, row.stars, row.license, row.pushed_at, row.note
        ));
    }
    lines.push(String::new());
    lines.push("30-day star velocity is not invented. Cadence is the commit page since 30 days when a token is set.".into());
    lines.join("\n") + "\n"
}

pub fn write_digest(brain: &Path, rows: &[RepoRow]) -> EvolResult<PathBuf> {
    let path = digest_path(brain);
    if path.components().any(|c| {
        let s = c.as_os_str().to_string_lossy();
        s.contains("memories")
    }) {
        // digest_path is catalogue/, this guard is for a bad brain join
    }
    fs::create_dir_all(path.parent().unwrap())?;
    fs::write(&path, render_digest(rows))?;
    Ok(path)
}

pub async fn harvest(
    brain: &Path,
    token: Option<&str>,
    watchlist_raw: Option<&str>,
    star: bool,
) -> EvolResult<PathBuf> {
    let watch = if watchlist_raw.is_some() {
        parse_watchlist(watchlist_raw)
    } else {
        crate::github::watchlist::load_watchlist_file(brain)
    };
    let mut rows = Vec::new();
    for repo in &watch {
        let live = if let Some(token) = token {
            fetch_repo(token, &repo.slug).await.ok()
        } else {
            None
        };
        let mut row = row_from_watch(repo, live);
        if star {
            if let Some(token) = token {
            if let Ok(Some(tag)) = latest_release(token, &repo.slug).await {
                row.note = format!("{}; release {tag}", row.note);
            }
            match already_starred(token, &repo.slug).await {
                Ok(true) => {
                    row.starred = true;
                    row.note = format!("{}; already starred", row.note);
                }
                Ok(false) if should_star(row.score, false, row.star_ok) => {
                    match star_and_watch(token, &repo.slug).await {
                        Ok(()) => {
                            row.starred = true;
                            row.note = format!("{}; starred this harvest", row.note);
                        }
                        Err(err) => row.note = format!("{}; star skipped: {err}", row.note),
                    }
                }
                Ok(false) => row.note = format!("{}; below star line or catalogue-only", row.note),
                Err(err) => row.note = format!("{}; star check skipped: {err}", row.note),
            }
            }
        }
        rows.push(row);
    }
    let _ = Index::persist(brain);
    let path = write_digest(brain, &rows)?;
    if path.to_string_lossy().contains("memories/") {
        return Err(crate::error::EvolError::BadPath(path.display().to_string()));
    }
    Ok(path)
}

pub fn top_titles(brain: &Path, n: usize) -> Vec<String> {
    let text = fs::read_to_string(digest_path(brain)).unwrap_or_default();
    text.lines()
        .filter(|l| l.starts_with("| ") && !l.contains("---") && !l.contains("repo |"))
        .filter_map(|l| l.split('|').nth(1).map(|s| s.trim().to_string()))
        .filter(|s| !s.is_empty())
        .take(n)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::github::watchlist::parse_watchlist;
    use std::fs;

    #[test]
    fn harvest_writes_catalogue_not_taste() {
        let brain = std::env::temp_dir().join(format!("evo-h-{}", uuid::Uuid::new_v4().simple()));
        fs::create_dir_all(brain.join("memories/semantic")).unwrap();
        let pin = brain.join("memories/semantic/music-taste.md");
        fs::write(&pin, "do not touch\n").unwrap();
        let before = fs::read(&pin).unwrap();
        let rows: Vec<_> = parse_watchlist(None)
            .iter()
            .map(|r| crate::github::client::row_from_watch(r, None))
            .collect();
        let path = write_digest(&brain, &rows).unwrap();
        assert!(path.ends_with("catalogue/repos-digest.md"));
        assert!(!path.to_string_lossy().contains("memories"));
        let text = fs::read_to_string(&path).unwrap();
        assert!(text.contains("Not taste"));
        assert!(text.contains("rust-lang/rust"));
        assert_eq!(fs::read(&pin).unwrap(), before);
        assert!(!brain.join("memories/semantic/repos-digest.md").exists());
        let _ = fs::remove_dir_all(&brain);
    }
}

pub fn harvest_at(brain: &Path) -> Option<String> {
    let text = fs::read_to_string(digest_path(brain)).ok()?;
    text.lines()
        .next()
        .and_then(|l| l.strip_prefix("# Repo digest "))
        .map(|s| s.trim().to_string())
}

pub fn counted(brain: &Path) -> usize {
    let text = fs::read_to_string(digest_path(brain)).unwrap_or_default();
    text.lines()
        .find_map(|l| l.strip_prefix("Repos scored: ").and_then(|r| r.trim_end_matches('.').parse().ok()))
        .unwrap_or(0)
}
