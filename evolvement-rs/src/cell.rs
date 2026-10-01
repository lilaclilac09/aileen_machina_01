use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::vm::jail::command_allowed;

const ALLOW: &[&str] = &["echo", "ls", "rg", "pwd", "cat", "printf", "touch", "mkdir"];

pub fn work_dir(cells: &Path, visitor_id: &str) -> PathBuf {
    let safe: String = visitor_id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '_' || *c == '-')
        .collect();
    let id = if safe.is_empty() { "anon".into() } else { safe };
    cells.join(id).join("work")
}

pub fn exec_in_work(work: &Path, line: &str) -> Result<String, String> {
    let cmd = line
        .trim()
        .trim_start_matches("run ")
        .trim_start_matches("$")
        .trim();
    if cmd.is_empty() {
        return Err("empty command".into());
    }
    command_allowed(cmd).map_err(|e| e.to_string())?;
    let mut parts = cmd.split_whitespace();
    let bin = parts.next().unwrap();
    if bin.contains('/') || bin.contains("..") || !ALLOW.contains(&bin) {
        return Err(format!("refused: {bin}"));
    }
    let args: Vec<&str> = parts.collect();
    fs::create_dir_all(work).map_err(|e| e.to_string())?;
    let out = Command::new(bin)
        .args(&args)
        .current_dir(work)
        .env_clear()
        .env("PATH", std::env::var("PATH").unwrap_or_else(|_| "/usr/bin:/bin".into()))
        .output()
        .map_err(|e| e.to_string())?;
    let mut text = String::from_utf8_lossy(&out.stdout).to_string();
    let err = String::from_utf8_lossy(&out.stderr);
    if !err.is_empty() {
        text.push_str(&err);
    }
    text.push_str(&format!("\nexit {}", out.status.code().unwrap_or(-1)));
    Ok(text.trim().to_string())
}

pub fn write_patch(work: &Path, branch: &str, body: &str) -> Result<PathBuf, String> {
    fs::create_dir_all(work).map_err(|e| e.to_string())?;
    let path = work.join("PATCH.md");
    if path.to_string_lossy().contains("memories/") {
        return Err("refused taste write".into());
    }
    let text = format!("# {branch}\n\n{body}\n");
    fs::write(&path, text).map_err(|e| e.to_string())?;
    Ok(path)
}
