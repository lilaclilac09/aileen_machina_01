use std::path::Path;

use crate::github::digest;
use crate::memory::dream;
use crate::memory::hard;
use crate::sell::routes::topics_from;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Offer {
    WatchDigest,
    StarTwo,
    Hire,
}

pub struct Facts {
    pub latest_date: String,
    pub dream_line: String,
    pub harvest_n: usize,
    pub top3: Vec<String>,
    pub topics: Vec<String>,
}

impl Facts {
    pub fn load(brain: &Path, topics: &[String]) -> Self {
        let latest = hard::read_pin(&brain.join("memories/semantic/latest-content.md")).unwrap_or_default();
        let latest_date = latest
            .lines()
            .find_map(|l| l.strip_prefix("generatedAt: ").map(|s| s.trim().to_string()))
            .unwrap_or_else(|| "undated".into());
        let dream_line = dream::latest_dream(brain)
            .map(|(date, line)| format!("{date} — {line}"))
            .unwrap_or_else(|| "no dream report yet".into());
        let top3 = digest::top_titles(brain, 3);
        Self {
            latest_date,
            dream_line,
            harvest_n: digest::counted(brain),
            top3,
            topics: topics.to_vec(),
        }
    }
}

pub fn choose_offer(message: &str, topics: &[String]) -> Offer {
    let m = message.to_lowercase();
    if m.contains("hire") || topics.iter().any(|t| t == "hire") && m.contains("hire") {
        return Offer::Hire;
    }
    if m.contains("subscribe") || m.contains("digest") || m.contains("watch") {
        return Offer::WatchDigest;
    }
    if topics_from(message).iter().any(|t| t == "hire") {
        return Offer::Hire;
    }
    Offer::StarTwo
}

#[derive(Clone, Debug)]
pub struct EvolvementCard {
    pub dreamt_at: Option<String>,
    pub compressed: Vec<String>,
    pub repos_starred: Vec<String>,
    pub visitor_topics: Vec<String>,
    pub latest_at: String,
}

impl EvolvementCard {
    pub fn from_facts(facts: &Facts) -> Self {
        let (dreamt_at, compressed) = match facts.dream_line.split_once(" — ") {
            Some((date, line)) => (Some(date.to_string()), vec![line.to_string()]),
            None => (None, vec![facts.dream_line.clone()]),
        };
        Self {
            dreamt_at,
            compressed,
            repos_starred: facts.top3.clone(),
            visitor_topics: facts.topics.clone(),
            latest_at: facts.latest_date.clone(),
        }
    }
}

/// Public voice. One offer. Dates required. No invented fine-tune.
pub fn pitch(card: &EvolvementCard, lang: &str) -> String {
    let offer = if card.visitor_topics.iter().any(|t| t == "hire") {
        Offer::Hire
    } else if card.repos_starred.len() >= 2 {
        Offer::StarTwo
    } else {
        Offer::WatchDigest
    };
    let dream = card.dreamt_at.clone().unwrap_or_else(|| "no dream report yet".into());
    let compressed = if card.compressed.is_empty() {
        "nothing compressed".to_string()
    } else {
        card.compressed.join("; ")
    };
    let repos = if card.repos_starred.is_empty() {
        "none".to_string()
    } else {
        card.repos_starred.join(", ")
    };
    let topics = if card.visitor_topics.is_empty() {
        match lang {
            "zh" => "这条访客线还没有话题。".into(),
            "de" => "Keine Soft-Themen bei diesem Besuch.".into(),
            _ => "No soft topics on this visitor.".into(),
        }
    } else {
        match lang {
            "zh" => format!("这条访客线问过 {}。", card.visitor_topics.join("、")),
            "de" => format!("Dieser Besuch fragte nach {}.", card.visitor_topics.join(", ")),
            _ => format!("This visitor asked about {}.", card.visitor_topics.join(", ")),
        }
    };
    let two = if card.repos_starred.len() >= 2 {
        format!("{} and {}", card.repos_starred[0], card.repos_starred[1])
    } else {
        repos.clone()
    };
    match lang {
        "zh" => {
            let offer_line = match offer {
                Offer::WatchDigest => "只给一个：看 digest。",
                Offer::StarTwo => "只给一个：和她一起 star 这两个。",
                Offer::Hire => "只给一个：hire。",
            };
            format!(
                "最新内容日期 {latest}。梦报告日期 {dream}。压缩了：{compressed}。收获仓库：{repos}。{topics} 她是把房间写进 git 的 founding engineer。没有微调。证据是 commit、梦报告、digest。{offer_line}",
                latest = card.latest_at,
            )
        }
        "de" => {
            let offer_line = match offer {
                Offer::WatchDigest => "Angebot: Digest beobachten.",
                Offer::StarTwo => "Angebot: diese zwei starren.",
                Offer::Hire => "Angebot: hire.",
            };
            format!(
                "Latest-content Datum {latest}. Dream-Datum {dream}. Komprimiert: {compressed}. Repos: {repos}. {topics} Sie ist die founding engineer, die den Raum in git schreibt. Kein Fine-tune. Beweis: Commit, Dream-Report, Digest. {offer_line}",
                latest = card.latest_at,
            )
        }
        _ => {
            let offer_line = match offer {
                Offer::WatchDigest => "Offer: watch the digest.".to_string(),
                Offer::StarTwo => format!("Offer: star these two with her — {two}."),
                Offer::Hire => "Offer: hire.".into(),
            };
            format!(
                "Latest content snapshot: {latest}. Last dream: {dream}. Compressed: {compressed}. Harvest repos: {repos}. {topics} She is the founding engineer who writes the room into git. No fine-tune. Proof is the commit, the dream report, and the digest. {offer_line}",
                latest = card.latest_at,
            )
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_offer_in_each_language() {
        let card = EvolvementCard {
            dreamt_at: Some("2026-09-25".into()),
            compressed: vec!["12 pins".into()],
            repos_starred: vec!["rust-lang/rust".into(), "tokio-rs/axum".into()],
            visitor_topics: vec![],
            latest_at: "2026-09-22".into(),
        };
        let en = pitch(&card, "en");
        let zh = pitch(&card, "zh");
        let de = pitch(&card, "de");
        assert!(en.contains("2026-09-22") && en.contains("2026-09-25"));
        assert!(zh.contains("2026-09-25") && zh.contains("没有微调"));
        assert!(de.contains("Kein Fine-tune"));
        assert_eq!(en.matches("Offer:").count(), 1);
        assert_eq!(zh.matches("只给一个").count(), 1);
        assert_eq!(de.matches("Angebot:").count(), 1);
        assert!(!en.to_lowercase().contains("fine-tune happened"));
    }
}

pub fn offer_count(text: &str) -> usize {
    let mut n = 0;
    if text.contains("watch the digest") {
        n += 1;
    }
    if text.contains("star these two") {
        n += 1;
    }
    if text.contains("Offer: hire") {
        n += 1;
    }
    n
}
