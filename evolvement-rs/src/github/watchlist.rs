use serde::Serialize;

pub const STAR_MIN: i64 = 70;

#[derive(Clone, Debug)]
pub struct WatchRepo {
    pub slug: String,
    pub relevance: i64,
    pub why: &'static str,
    /// Qdrant stays on the catalogue card. Do not star it or switch L2 to it.
    pub star_ok: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct RepoScore {
    pub full_name: String,
    pub score: f32,
    pub why: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct RepoRow {
    pub slug: String,
    pub stars: u64,
    pub license: String,
    pub pushed_at: String,
    pub commits_page: u32,
    pub score: i64,
    pub why: String,
    pub note: String,
    pub star_ok: bool,
    pub starred: bool,
}

pub fn default_watchlist() -> Vec<WatchRepo> {
    vec![
        WatchRepo { slug: "rust-lang/rust".into(), relevance: 40, why: "language she writes", star_ok: true },
        WatchRepo { slug: "tokio-rs/tokio".into(), relevance: 36, why: "async runtime", star_ok: true },
        WatchRepo { slug: "tokio-rs/axum".into(), relevance: 34, why: "http she already ships", star_ok: true },
        WatchRepo { slug: "tokio-rs/tracing".into(), relevance: 22, why: "traces the serve loop", star_ok: true },
        WatchRepo { slug: "Aandreba/snes-rs".into(), relevance: 12, why: "snes-rs class, not a meme", star_ok: true },
        WatchRepo { slug: "quickwit-oss/tantivy".into(), relevance: 36, why: "L2 index, not a day-one vector warehouse", star_ok: true },
        WatchRepo { slug: "qdrant/qdrant".into(), relevance: 16, why: "catalogue contrast only; do not switch L2", star_ok: false },
        WatchRepo { slug: "lancedb/lancedb".into(), relevance: 24, why: "columnar retrieval, catalogue", star_ok: true },
        WatchRepo { slug: "0xPlaygrounds/rig".into(), relevance: 26, why: "rust agent loop", star_ok: true },
        WatchRepo { slug: "anza-xyz/agave".into(), relevance: 32, why: "solana client already in her essays", star_ok: true },
        WatchRepo { slug: "jito-foundation/jito-solana".into(), relevance: 30, why: "solana block engine, already in the stack", star_ok: true },
        WatchRepo { slug: "lilaclilac09/aileen_machina_01".into(), relevance: 24, why: "self digest so the room has a date", star_ok: true },
    ]
}

pub fn should_star(score: i64, already: bool, star_ok: bool) -> bool {
    star_ok && !already && score > STAR_MIN
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn qdrant_is_not_starred_by_default() {
        let q = default_watchlist().into_iter().find(|r| r.slug == "qdrant/qdrant").unwrap();
        assert!(!q.star_ok);
        assert!(!should_star(99, false, q.star_ok));
        assert!(!should_star(99, true, true));
        assert!(should_star(71, false, true));
        assert!(admit("rust-lang/rust"));
        assert!(!admit("elonmusk/spacex"));
        assert!(!teacher_ok("elonmusk"));
        assert!(teacher_ok("semianalysis"));
    }
}

pub fn load_watchlist_file(_brain: &std::path::Path) -> Vec<WatchRepo> {
    let candidates = [
        std::path::PathBuf::from("watchlist.toml"),
        std::path::PathBuf::from("evolvement-rs/watchlist.toml"),
    ];
    for path in candidates {
        if let Ok(text) = std::fs::read_to_string(&path) {
            let parsed = parse_watchlist_text(&text);
            if !parsed.is_empty() {
                return parsed;
            }
        }
    }
    parse_watchlist(None)
}

fn parse_watchlist_text(text: &str) -> Vec<WatchRepo> {
    let mut out = Vec::new();
    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let (star_ok, slug) = if let Some(rest) = line.strip_prefix('!') {
            (false, rest.trim())
        } else {
            (true, line)
        };
        if !admit(slug) {
            continue;
        }
        let base = default_watchlist().into_iter().find(|r| r.slug.eq_ignore_ascii_case(slug));
        out.push(WatchRepo {
            slug: slug.to_string(),
            relevance: base.as_ref().map(|b| b.relevance).unwrap_or(10),
            why: base.as_ref().map(|b| b.why).unwrap_or("watchlist.toml"),
            star_ok: star_ok && base.as_ref().map(|b| b.star_ok).unwrap_or(true),
        });
    }
    out
}

pub fn parse_watchlist(raw: Option<&str>) -> Vec<WatchRepo> {
    let Some(raw) = raw else {
        return default_watchlist().into_iter().filter(|r| admit(&r.slug)).collect();
    };
    let mut out = Vec::new();
    for part in raw.split(',') {
        let slug = part.trim();
        if slug.is_empty() || !admit(slug) {
            continue;
        }
        let base = default_watchlist()
            .into_iter()
            .find(|r| r.slug.eq_ignore_ascii_case(slug));
        out.push(WatchRepo {
            slug: slug.to_string(),
            relevance: base.as_ref().map(|b| b.relevance).unwrap_or(10),
            why: "watchlist env",
            star_ok: base.as_ref().map(|b| b.star_ok).unwrap_or(true),
        });
    }
    out
}

pub fn admit(slug: &str) -> bool {
    let s = slug.to_ascii_lowercase();
    if s.contains("elon") || s.contains("meme") || s.contains("doge") || s.contains("spacex") {
        return false;
    }
    let Some((owner, name)) = s.split_once('/') else {
        return false;
    };
    !owner.is_empty() && !name.is_empty() && !name.contains('/')
}

/// X / teachers ingest. Watchlist authors only. No RT meme noise.
pub fn teacher_ok(author: &str) -> bool {
    matches!(
        author.trim().trim_start_matches('@').to_ascii_lowercase().as_str(),
        "semianalysis" | "mach33"
    )
}

pub fn license_ok(spdx: &str) -> bool {
    matches!(
        spdx,
        "MIT" | "Apache-2.0" | "AGPL-3.0" | "MIT OR Apache-2.0" | "Apache-2.0 OR MIT"
    )
}

pub fn score_row(relevance: i64, license: &str, pushed_recent: bool, commits_page: u32) -> i64 {
    let mut score = relevance;
    if license_ok(license) {
        score += 20;
    }
    if pushed_recent {
        score += 15;
    }
    if commits_page >= 8 {
        score += 10;
    }
    score
}
