use std::path::Path;
use std::process::Stdio;

use serde_json::{json, Value};

pub const MAX_AUDIO_BYTES: usize = 100 * 1024 * 1024;

/// Shells out to the `whisper` CLI instead of linking whisper-rs.
/// whisper-rs compiles whisper.cpp (cmake, a C++ toolchain, a large model).
/// A CLI keeps `cargo build` free of that, and fails closed when the binary
/// or the model file is missing.

pub fn allowed_audio(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    lower.ends_with(".mp3") || lower.ends_with(".wav") || lower.ends_with(".m4a")
}

pub fn parse_whisper_json(raw: &str) -> Result<Value, ()> {
    let parsed: Value = serde_json::from_str(raw).map_err(|_| ())?;
    let text = parsed.get("text").and_then(Value::as_str).ok_or(())?;
    let segments = parsed
        .get("segments")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let segments: Vec<Value> = segments
        .into_iter()
        .filter_map(|segment| {
            let start = segment.get("start")?.as_f64()?;
            let end = segment.get("end")?.as_f64()?;
            let text = segment.get("text")?.as_str()?;
            Some(json!({ "start": start, "end": end, "text": text }))
        })
        .collect();
    Ok(json!({ "text": text, "segments": segments }))
}

pub async fn transcribe_file(audio: &Path) -> Result<Value, String> {
    let dir = audio
        .parent()
        .ok_or_else(|| "audio path has no directory".to_string())?;
    let output = tokio::process::Command::new("whisper")
        .arg(audio)
        .arg("--model")
        .arg(std::env::var("WHISPER_MODEL").unwrap_or_else(|_| "base".into()))
        .arg("--output_format")
        .arg("json")
        .arg("--output_dir")
        .arg(dir)
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|_| "whisper is not installed".to_string())?;
    if !output.status.success() {
        return Err("whisper failed".into());
    }
    let stem = audio
        .file_stem()
        .and_then(|stem| stem.to_str())
        .ok_or_else(|| "audio name".to_string())?;
    let json_path = dir.join(format!("{stem}.json"));
    let raw = tokio::fs::read_to_string(&json_path)
        .await
        .map_err(|_| "whisper did not write a transcript".to_string())?;
    let _ = tokio::fs::remove_file(&json_path).await;
    parse_whisper_json(&raw).map_err(|_| "whisper json was not a transcript".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extensions_and_whisper_json() {
        assert!(allowed_audio("note.MP3"));
        assert!(allowed_audio("note.wav"));
        assert!(allowed_audio("note.m4a"));
        assert!(!allowed_audio("note.txt"));
        let parsed = parse_whisper_json(
            r#"{"text":"你好","segments":[{"start":0.0,"end":1.2,"text":"你好","extra":1}]}"#,
        )
        .unwrap();
        assert_eq!(parsed["text"], "你好");
        assert_eq!(parsed["segments"][0]["end"], 1.2);
        assert!(parsed["segments"][0].get("extra").is_none());
    }
}
