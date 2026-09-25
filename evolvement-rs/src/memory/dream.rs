use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{EvolError, EvolResult};
use crate::memory::hard;

/// Compression job. Writes `proposals/` only. Never deletes hard pins.
pub fn dream(brain: &Path) -> EvolResult<PathBuf> {
    let before = hard::pin_bytes(brain)?;
    let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let pins = hard::list_pins(brain)?;
    let mut kept = Vec::new();
    for path in &pins {
        if hard::is_catalogue_lane(path) {
            continue;
        }
        let rel = path
            .strip_prefix(brain)
            .unwrap_or(path)
            .to_string_lossy()
            .replace('\\', "/");
        kept.push(rel);
    }
    let dir = brain.join("proposals");
    fs::create_dir_all(&dir)?;
    let dest = dir.join(format!("dream-{date}.md"));
    let body = format!(
        "---\ndate: {date}\nkind: proposal\nlane: dreaming\n---\n\n# Dream report {date}\n\nI compressed {n} hard pins on {date}. I did not delete any pin.\n\nPins kept:\n{list}\n\nChip and research PDFs stayed in the catalogue lane. This file is a proposal. Promote is a human step under aileena_second_brain only.\n",
        n = kept.len(),
        list = kept.iter().map(|p| format!("- {p}")).collect::<Vec<_>>().join("\n"),
    );
    fs::write(&dest, body)?;
    let after = hard::pin_bytes(brain)?;
    if before != after {
        let _ = fs::remove_file(&dest);
        return Err(EvolError::Msg("dream mutated hard pins".into()));
    }
    Ok(dest)
}

pub fn latest_dream(brain: &Path) -> Option<(String, String)> {
    let dir = brain.join("proposals");
    let mut files = fs::read_dir(&dir).ok()?.filter_map(|e| e.ok()).collect::<Vec<_>>();
    files.retain(|e| {
        e.path()
            .file_name()
            .and_then(|n| n.to_str())
            .map(|n| n.starts_with("dream-") && n.ends_with(".md"))
            .unwrap_or(false)
    });
    files.sort_by_key(|e| e.file_name());
    let path = files.last()?.path();
    let name = path.file_stem()?.to_string_lossy().to_string();
    let date = name.trim_start_matches("dream-").to_string();
    let text = fs::read_to_string(&path).ok()?;
    let line = text
        .lines()
        .find(|l| l.starts_with("I compressed"))
        .unwrap_or("no compression line")
        .to_string();
    Some((date, line))
}

/// Copy a proposal into memories/ only on the allowlisted bot/human path.
/// Existing pins are not overwritten and nothing is deleted.
pub fn promote(brain: &Path, file: &Path, dest_name: &str, allow: bool) -> EvolResult<PathBuf> {
    if !allow {
        return Err(EvolError::NotAllowlisted(
            "set EVOLVEMENT_PROMOTE=allow".into(),
        ));
    }
    let src = if file.is_absolute() {
        file.to_path_buf()
    } else {
        brain.join(file)
    };
    let proposals = brain.join("proposals");
    let canon_src = src.canonicalize().unwrap_or(src.clone());
    let canon_prop = proposals.canonicalize().unwrap_or(proposals);
    if !canon_src.starts_with(&canon_prop) {
        return Err(EvolError::NotAllowlisted(canon_src.display().to_string()));
    }
    let name = if dest_name.trim().is_empty() {
        canon_src
            .file_name()
            .ok_or_else(|| EvolError::BadPath("missing name".into()))?
            .to_owned()
    } else {
        PathBuf::from(dest_name.trim()).into_os_string()
    };
    if name.to_string_lossy().contains('/') || name.to_string_lossy().contains("..") {
        return Err(EvolError::BadPath(name.to_string_lossy().into()));
    }
    let rel = PathBuf::from("memories").join("archived").join(name);
    let rel_str = rel.to_string_lossy().replace('\\', "/");
    if !rel_str.starts_with("memories/archived/") || rel_str.contains("..") {
        return Err(EvolError::NotAllowlisted(rel_str));
    }
    if rel_str.contains("taste") {
        return Err(EvolError::NotAllowlisted("taste pins are not a promote target".into()));
    }
    let dest = brain.join(&rel);
    if dest.exists() {
        return Err(EvolError::Msg(format!(
            "refuse overwrite of existing pin {}",
            dest.display()
        )));
    }
    fs::create_dir_all(dest.parent().unwrap())?;
    fs::copy(&canon_src, &dest)?;
    Ok(dest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn brain() -> PathBuf {
        let p = std::env::temp_dir().join(format!("evo-dream-{}", uuid::Uuid::new_v4().simple()));
        fs::create_dir_all(p.join("memories/semantic")).unwrap();
        fs::write(p.join("memories/semantic/music-taste.md"), "pin techno\n").unwrap();
        p
    }

    #[test]
    fn dream_does_not_delete_pins() {
        let brain = brain();
        let before = fs::read(brain.join("memories/semantic/music-taste.md")).unwrap();
        let report = dream(&brain).unwrap();
        let after = fs::read(brain.join("memories/semantic/music-taste.md")).unwrap();
        assert_eq!(before, after);
        assert!(report.starts_with(brain.join("proposals")));
        assert!(fs::read_to_string(&report).unwrap().contains("I did not delete"));
        let _ = fs::remove_dir_all(&brain);
    }
}
