use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{EvolError, EvolResult};

/// Hard pins live in git under `memories/**`. This module only reads.
pub fn memory_root(brain: &Path) -> PathBuf {
    brain.join("memories")
}

pub fn list_pins(brain: &Path) -> EvolResult<Vec<PathBuf>> {
    let root = memory_root(brain);
    let mut out = Vec::new();
    if root.is_dir() {
        walk(&root, &mut out)?;
    }
    out.sort();
    Ok(out)
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>) -> EvolResult<()> {
    for ent in fs::read_dir(dir)? {
        let ent = ent?;
        let path = ent.path();
        if path.is_dir() {
            walk(&path, out)?;
        } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
            out.push(path);
        }
    }
    Ok(())
}

pub fn read_pin(path: &Path) -> EvolResult<String> {
    let text = fs::read_to_string(path)?;
    if path.components().any(|c| c.as_os_str() == "..") {
        return Err(EvolError::BadPath(path.display().to_string()));
    }
    Ok(text)
}

/// Chip / semi / research PDFs are not Dreaming taste.
pub fn is_catalogue_lane(path: &Path) -> bool {
    let s = path.to_string_lossy().to_ascii_lowercase();
    s.contains("catalogue")
        || s.ends_with(".pdf")
        || s.contains("/chip")
        || s.contains("research-pdf")
}

pub fn pin_bytes(brain: &Path) -> EvolResult<Vec<(PathBuf, Vec<u8>)>> {
    let mut rows = Vec::new();
    for path in list_pins(brain)? {
        rows.push((path.clone(), fs::read(&path)?));
    }
    Ok(rows)
}
