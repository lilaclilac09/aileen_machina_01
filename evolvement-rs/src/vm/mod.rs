pub mod jail;

use std::process::Command;

/// Real hypervisor only. A missing binary is a block, not a host shell.
pub fn hypervisor() -> Result<&'static str, String> {
    if Command::new("docker").arg("version").output().is_ok() {
        return Ok("docker");
    }
    Err("blocked_on: docker. `docker version` failed. No host-shell substitute.".into())
}
