use serde::Serialize;

use crate::error::EvolResult;
use crate::vm::hypervisor;
use crate::vm::jail::{command_allowed, jail_write};

#[derive(Clone, Debug, Serialize)]
pub struct ForgePlan {
    pub branch: String,
    pub commit_message: String,
    pub pr_body: String,
    pub files: Vec<String>,
    pub commands: Vec<String>,
    pub refused: Vec<String>,
    pub blocked_on: Option<String>,
    pub pr_url: Option<String>,
}

pub fn commit_message(task_id: &str, task: &str) -> String {
    let chinese = task.chars().any(|c| !c.is_ascii());
    if chinese {
        return format!("fix: apply task {task_id}");
    }
    let words = task
        .split_whitespace()
        .filter(|w| w.chars().all(|c| c.is_ascii()))
        .take(12)
        .collect::<Vec<_>>()
        .join(" ");
    if words.is_empty() {
        format!("fix: apply task {task_id}")
    } else {
        format!("fix: {words}")
    }
}

pub fn plan(
    task_id: &str,
    repo_url: &str,
    task: &str,
    files: &[String],
    commands: &[String],
    writes: &[String],
) -> ForgePlan {
    let branch = format!("agent/{task_id}");
    let commit_message = commit_message(task_id, task);
    let mut refused = Vec::new();
    let mut kept = Vec::new();
    for cmd in commands {
        match command_allowed(cmd) {
            Ok(()) => kept.push(cmd.clone()),
            Err(err) => refused.push(format!("{cmd} — {err}")),
        }
    }
    for path in writes {
        if let Err(err) = jail_write(path) {
            refused.push(format!("{path} — {err}"));
        }
    }
    let blocked_on = match hypervisor() {
        Ok(_) => None,
        Err(err) => {
            refused.push("host shell not used".into());
            Some(err)
        }
    };
    let file_lines = if files.is_empty() {
        "- (none yet)".to_string()
    } else {
        files.iter().map(|f| format!("- {f}")).collect::<Vec<_>>().join("\n")
    };
    let cmd_lines = if kept.is_empty() {
        "- (none ran)".to_string()
    } else {
        kept.iter().map(|c| format!("- `{c}`")).collect::<Vec<_>>().join("\n")
    };
    let pr_body = format!(
        "Task: {task_id}\nRepo: {repo_url}\n\nFiles:\n{file_lines}\n\nCommands:\n{cmd_lines}\n\nHuman merges. Forge does not push main and does not deploy.\n"
    );
    ForgePlan {
        branch,
        commit_message,
        pr_body,
        files: files.to_vec(),
        commands: kept,
        refused,
        blocked_on,
        pr_url: None,
    }
}

pub fn assert_english(message: &str) -> EvolResult<()> {
    if message.chars().all(|c| c.is_ascii()) {
        Ok(())
    } else {
        Err(crate::error::EvolError::Msg("commit message must be English ASCII".into()))
    }
}

pub fn tools_for(route: crate::sell::routes::Route) -> &'static [&'static str] {
    match route {
        crate::sell::routes::Route::Forge => &["forge_exec", "forge_write"],
        crate::sell::routes::Route::Hire | crate::sell::routes::Route::Taste => &[],
        _ => &[],
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vm::jail::{command_allowed, jail_write};

    #[test]
    fn cannot_push_main() {
        assert!(command_allowed("git push origin main").is_err());
        assert!(command_allowed("git push origin HEAD:main").is_err());
        assert!(command_allowed("git push --force origin main").is_err());
        assert!(command_allowed("git push -u origin agent/t1").is_ok());
        assert!(command_allowed("npm publish").is_err());
        assert!(command_allowed("cargo publish").is_err());
    }

    #[test]
    fn path_jail_blocks_passwd() {
        assert!(jail_write("/etc/passwd").unwrap_err().to_string().contains("403"));
        assert!(jail_write("/work/../../etc/passwd").is_err());
        assert!(jail_write("/work/note.txt").is_ok());
    }

    #[test]
    fn chinese_task_commit_is_english() {
        let msg = commit_message("t1", "把按钮改成圆角，并打开 PR");
        assert_english(&msg).unwrap();
        assert_eq!(msg, "fix: apply task t1");
        let planned = plan(
            "t1",
            "https://github.com/lilaclilac09/aileen_machina_01",
            "把按钮改成圆角",
            &["aileena-new/components/Foo.tsx".into()],
            &["cargo test --test lanes".into(), "git push origin main".into()],
            &["/etc/passwd".into()],
        );
        assert!(planned.pr_body.contains("aileena-new/components/Foo.tsx"));
        assert!(planned.pr_body.contains("cargo test --test lanes"));
        assert!(planned.refused.iter().any(|r| r.contains("main")));
        assert!(planned.refused.iter().any(|r| r.contains("403")));
        assert!(planned.pr_url.is_none());
        assert!(planned.blocked_on.is_some());
    }

    #[test]
    fn hire_and_taste_do_not_see_forge_tools() {
        use crate::sell::routes::{classify, Route};
        assert_eq!(classify("is she available for hire?"), Route::Hire);
        assert!(tools_for(Route::Hire).is_empty());
        assert!(tools_for(Route::Taste).is_empty());
        assert!(!tools_for(Route::Forge).is_empty());
    }
}
