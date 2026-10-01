use crate::modes::{all_modes, mode_name, phase_name};
use crate::DrillReport;

pub fn render(report: &DrillReport) -> String {
    let mut modes = String::new();
    for mode in all_modes() {
        modes.push_str(&format!(
            "<li>{} — {}</li>",
            mode_name(mode),
            phase_name(mode)
        ));
    }
    format!(
        r#"<!doctype html>
<meta charset="utf-8">
<title>booking-lab</title>
<main>
<h1>booking-lab</h1>
<p>127.0.0.1 only. No booking site.</p>
<ul>
<li>human {human_ok}/{human_sent} {human_rate:.2}</li>
<li>script blocked {script_blocked}/{script_sent} {script_rate:.2}</li>
<li>bulk blocked {bulk_blocked}/{bulk_sent} {bulk_rate:.2}</li>
</ul>
<ul>
{modes}
</ul>
</main>
"#,
        human_ok = report.human.allowed,
        human_sent = report.human.sent,
        human_rate = report.human_pass_rate,
        script_blocked = report.script.blocked,
        script_sent = report.script.sent,
        script_rate = report.script_catch_rate,
        bulk_blocked = report.bulk.blocked,
        bulk_sent = report.bulk.sent,
        bulk_rate = report.bulk_catch_rate,
        modes = modes,
    )
}
