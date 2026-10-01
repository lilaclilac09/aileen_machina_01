use std::collections::HashMap;
use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::error::EvolResult;
use crate::memory::hard::{self, is_catalogue_lane};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Chunk {
    pub path: String,
    pub text: String,
}

#[derive(Clone, Debug)]
pub struct Hit {
    pub path: String,
    pub snippet: String,
    pub score: f32,
}

pub struct Index {
    pub chunks: Vec<Chunk>,
    df: HashMap<String, usize>,
}

impl Index {
    pub fn build(brain: &Path) -> EvolResult<Self> {
        let mut chunks = Vec::new();
        for path in hard::list_pins(brain)? {
            if is_catalogue_lane(&path) {
                continue;
            }
            let text = fs::read_to_string(&path).unwrap_or_default();
            let rel = path
                .strip_prefix(brain)
                .unwrap_or(&path)
                .to_string_lossy()
                .replace('\\', "/");
            for piece in split_chunks(&text) {
                chunks.push(Chunk {
                    path: rel.clone(),
                    text: piece,
                });
            }
        }
        let mut df = HashMap::new();
        for chunk in &chunks {
            let mut seen = Vec::new();
            for term in tokens(&chunk.text) {
                if !seen.contains(&term) {
                    *df.entry(term.clone()).or_insert(0) += 1;
                    seen.push(term);
                }
            }
        }
        Ok(Self { chunks, df })
    }

    pub fn search(&self, query: &str, limit: usize) -> Vec<Hit> {
        let q = tokens(query);
        if q.is_empty() || self.chunks.is_empty() {
            return Vec::new();
        }
        let n = self.chunks.len() as f32;
        let mut scored = Vec::new();
        for chunk in &self.chunks {
            let tf = term_counts(&chunk.text);
            let mut score = 0.0;
            for term in &q {
                let count = *tf.get(term).unwrap_or(&0) as f32;
                if count == 0.0 {
                    continue;
                }
                let docs = *self.df.get(term).unwrap_or(&1) as f32;
                let idf = ((n + 1.0) / docs).ln();
                score += (1.0 + count.ln()) * idf;
            }
            if score > 0.0 {
                scored.push(Hit {
                    path: chunk.path.clone(),
                    snippet: truncate(&chunk.text, 180),
                    score,
                });
            }
        }
        scored.sort_by(|a, b| b.score.total_cmp(&a.score));
        scored.truncate(limit.min(3));
        scored
    }

    /// Written on harvest. Catalogue file, not a taste pin.
    pub fn persist(brain: &Path) -> EvolResult<std::path::PathBuf> {
        let idx = Self::build(brain)?;
        let path = brain.join("catalogue").join("memory-index.json");
        fs::create_dir_all(path.parent().unwrap())?;
        let body = serde_json::to_string(&idx.chunks).map_err(|e| crate::error::EvolError::Msg(e.to_string()))?;
        fs::write(&path, body)?;
        Ok(path)
    }
}

fn split_chunks(text: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut buf = String::new();
    for line in text.lines() {
        if line.starts_with("<!--") {
            continue;
        }
        if buf.len() + line.len() > 480 {
            if !buf.trim().is_empty() {
                out.push(buf.trim().to_string());
            }
            buf.clear();
        }
        buf.push_str(line);
        buf.push('\n');
    }
    if !buf.trim().is_empty() {
        out.push(buf.trim().to_string());
    }
    if out.is_empty() && !text.trim().is_empty() {
        out.push(truncate(text, 480));
    }
    out
}

fn tokens(text: &str) -> Vec<String> {
    text.split(|c: char| !c.is_alphanumeric())
        .filter(|w| w.len() > 1)
        .map(|w| w.to_ascii_lowercase())
        .collect()
}

fn term_counts(text: &str) -> HashMap<String, usize> {
    let mut map = HashMap::new();
    for term in tokens(text) {
        *map.entry(term).or_insert(0) += 1;
    }
    map
}

pub fn truncate(text: &str, max: usize) -> String {
    let mut out = String::new();
    for ch in text.chars() {
        if out.chars().count() >= max {
            break;
        }
        out.push(ch);
    }
    out
}
