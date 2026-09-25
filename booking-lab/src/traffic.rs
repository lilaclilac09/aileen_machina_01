use crate::detect::{on_book, on_calendar, DetectConfig};
use crate::state::AppState;
use crate::{BookRequest, CalendarQuery, DrillReport, ProfileCount};
use std::time::{Duration, Instant};

pub enum Profile {
    Human,
    Script,
    Bulk,
}

/// Gaps sit inside the brief: human 1400–1800ms (the slow part of 800–1800,
/// so one home IP stays at or under 8 hits / 10s), script ~20ms.
pub fn gap(profile: Profile, i: u32) -> Duration {
    match profile {
        Profile::Human => Duration::from_millis(u64::from(1400 + (i % 3) * 200)),
        Profile::Script => Duration::from_millis(20),
        Profile::Bulk => Duration::from_millis(20),
    }
}

pub fn sample(profile: Profile, i: u32) -> (CalendarQuery, Option<BookRequest>) {
    match profile {
        Profile::Human => (
            CalendarQuery {
                session: format!("human-{i}"),
                ip: "192.0.2.10".into(),
            },
            Some(BookRequest {
                session: format!("human-{i}"),
                ip: "192.0.2.10".into(),
                slot: format!("2026-11-02T09:{i:02}"),
                applicant: "Ada Lovelace".into(),
            }),
        ),
        Profile::Script => (
            CalendarQuery {
                session: format!("bot-{i}"),
                ip: "198.51.100.7".into(),
            },
            None,
        ),
        Profile::Bulk => (
            CalendarQuery {
                session: format!("bulk-{i}"),
                ip: format!("203.0.113.{}", i % 8),
            },
            Some(BookRequest {
                session: format!("bulk-{i}"),
                ip: format!("203.0.113.{}", i % 8),
                slot: "2026-11-02T09:00".into(),
                applicant: format!("Bulk {i}"),
            }),
        ),
    }
}

fn rate(num: u32, den: u32) -> f64 {
    if den == 0 {
        0.0
    } else {
        f64::from(num) / f64::from(den)
    }
}

fn push(count: &mut ProfileCount, allow: bool) {
    count.sent += 1;
    if allow {
        count.allowed += 1;
    } else {
        count.blocked += 1;
    }
}

/// Virtual clock. Intervals advance the window; the handler does not sleep.
pub fn run_drill(st: &AppState, cfg: &DetectConfig, human_n: u32, script_n: u32, bulk_n: u32) -> DrillReport {
    st.reset_drill();
    let window = Duration::from_secs(cfg.calendar_window_secs);
    let mut human = ProfileCount { sent: 0, allowed: 0, blocked: 0 };
    let mut script = ProfileCount { sent: 0, allowed: 0, blocked: 0 };
    let mut bulk = ProfileCount { sent: 0, allowed: 0, blocked: 0 };

    let mut t = Instant::now();
    for i in 0..human_n {
        t += gap(Profile::Human, i);
        let (q, book) = sample(Profile::Human, i);
        let n = st.record_calendar_at(&q.ip, t, window);
        let cal = on_calendar(n, &q, cfg);
        let ok = cal.allow
            && book.as_ref().is_some_and(|b| {
                on_book(b).allow && st.try_book(&b.slot, &b.applicant).is_ok()
            });
        push(&mut human, ok);
    }

    let mut t = Instant::now();
    for i in 0..script_n {
        t += gap(Profile::Script, i);
        let (q, _) = sample(Profile::Script, i);
        let n = st.record_calendar_at(&q.ip, t, window);
        push(&mut script, on_calendar(n, &q, cfg).allow);
    }

    let mut t = Instant::now();
    for i in 0..bulk_n {
        t += gap(Profile::Bulk, i);
        let (q, _) = sample(Profile::Bulk, i);
        let n = st.record_calendar_at(&q.ip, t, window);
        push(&mut bulk, on_calendar(n, &q, cfg).allow);
    }

    DrillReport {
        human_pass_rate: rate(human.allowed, human.sent),
        script_catch_rate: rate(script.blocked, script.sent),
        bulk_catch_rate: rate(bulk.blocked, bulk.sent),
        human,
        script,
        bulk,
    }
}
