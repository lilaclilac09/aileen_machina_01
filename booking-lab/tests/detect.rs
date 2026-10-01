use booking_lab::detect::{on_book, on_calendar, DetectConfig};
use booking_lab::state::AppState;
use booking_lab::traffic::run_drill;
use booking_lab::{BookRequest, CalendarQuery};

fn q(ip: &str) -> CalendarQuery {
    CalendarQuery {
        session: "t".into(),
        ip: ip.into(),
    }
}

#[test]
fn burst_blocks_after_max() {
    let cfg = DetectConfig::default();
    let ok = on_calendar(8, &q("198.51.100.7"), &cfg);
    assert!(ok.allow);
    let blocked = on_calendar(9, &q("198.51.100.7"), &cfg);
    assert!(!blocked.allow);
    assert_eq!(blocked.reason, "calendar-burst");
}

#[test]
fn reserved_prefix_blocks() {
    let cfg = DetectConfig::default();
    let v = on_calendar(1, &q("203.0.113.4"), &cfg);
    assert!(!v.allow);
    assert_eq!(v.reason, "test-reserved-botnet-range");
}

#[test]
fn empty_applicant_blocks() {
    let v = on_book(&BookRequest {
        session: "t".into(),
        ip: "192.0.2.10".into(),
        slot: "s".into(),
        applicant: "  ".into(),
    });
    assert!(!v.allow);
    assert_eq!(v.reason, "empty-applicant");
}

#[test]
fn named_applicant_allows() {
    let v = on_book(&BookRequest {
        session: "t".into(),
        ip: "192.0.2.10".into(),
        slot: "s".into(),
        applicant: "Ada Lovelace".into(),
    });
    assert!(v.allow);
}

#[test]
fn login_test_is_local_token() {
    let st = AppState::new();
    let acc = st.register("ada@example.test".into());
    let s = st.login_test(&acc.id);
    assert_eq!(s.account_id, acc.id);
    assert!(!s.token.is_empty());
}

#[test]
fn drill_rates() {
    let st = AppState::new();
    let report = run_drill(&st, &DetectConfig::default(), 20, 30, 20);
    assert!(report.human_pass_rate >= 0.95, "{report:?}");
    assert!(report.script_catch_rate >= 0.60, "{report:?}");
    assert!(report.bulk_catch_rate >= 0.90, "{report:?}");
    assert_eq!(report.human.sent, 20);
    assert_eq!(report.script.sent, 30);
    assert_eq!(report.bulk.sent, 20);
}
