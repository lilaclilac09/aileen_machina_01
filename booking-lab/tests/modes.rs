use booking_lab::detect::DetectConfig;
use booking_lab::modes::{all_modes, phase_name, run, AttackMode, Ending, Opening, Phase};
use booking_lab::page::render;
use booking_lab::state::AppState;
use booking_lab::traffic::run_drill;

#[test]
fn page_lists_modes_and_rates() {
    let html = render(&run_drill(&AppState::new(), &DetectConfig::default(), 20, 30, 20));
    assert!(html.contains("human 20/20"));
    assert!(html.contains("No booking site"));
    for mode in all_modes() {
        assert!(html.contains(phase_name(mode)));
    }
    assert!(phase_name(AttackMode::CalendarGrab) == "calendar-opening");
}

#[test]
fn grab_stops_at_the_opening() {
    assert_eq!(run(AttackMode::CalendarGrab), Phase::Opening(Opening::CalendarJustOpened));
    assert_eq!(run(AttackMode::WaitlistLinkGrab), Phase::Opening(Opening::WaitlistMailLink));
}

#[test]
fn broken_holds_do_not_reach_the_counter() {
    assert_eq!(run(AttackMode::DocumentSwap), Phase::Ending(Ending::BackOfQueue));
    assert_eq!(run(AttackMode::UnpaidHold), Phase::Ending(Ending::BackOfQueue));
    assert_eq!(run(AttackMode::WrongCategory), Phase::Ending(Ending::TurnedAway));
    assert_eq!(all_modes().len(), 5);
}
