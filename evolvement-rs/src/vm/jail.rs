use crate::error::{EvolError, EvolResult};

/// Writable roots inside the cell. Host paths and taste pins are refused.
pub fn jail_write(path: &str) -> EvolResult<()> {
    let path = path.trim();
    if path.is_empty() || path.contains('\0') {
        return Err(EvolError::BadPath(path.into()));
    }
    if path.contains("..") {
        return Err(EvolError::Msg("403 path jail".into()));
    }
    let ok = path == "/work"
        || path.starts_with("/work/")
        || path == "/tmp"
        || path.starts_with("/tmp/");
    if !ok || path.contains("memories/") || path.contains("taste") {
        return Err(EvolError::Msg("403 path jail".into()));
    }
    Ok(())
}

pub fn command_allowed(cmd: &str) -> EvolResult<()> {
    let l = cmd.to_lowercase();
    if l.contains("npm publish")
        || l.contains("cargo publish")
        || l.contains("vercel")
        || l.contains("sudo ")
        || l.contains(" ssh ")
        || l.starts_with("ssh ")
        || l.contains("rm -rf /")
        || l.contains("docker.sock")
    {
        return Err(EvolError::Msg(format!("refused: {cmd}")));
    }
    if pushes_main(&l) {
        return Err(EvolError::Msg("refused: push to main".into()));
    }
    Ok(())
}

pub fn pushes_main(cmd: &str) -> bool {
    let l = cmd.to_lowercase();
    if !l.contains("push") {
        return false;
    }
    if l.contains("--force") || l.contains(" -f") || l.contains("push -f") {
        return l.contains("main");
    }
    l.contains(" main")
        || l.contains("origin/main")
        || l.contains(":main")
        || l.contains("refs/heads/main")
        || l.ends_with(" main")
}
