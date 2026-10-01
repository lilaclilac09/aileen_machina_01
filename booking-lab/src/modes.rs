/// Local names for the five shapes. No clock, no host, no request.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AttackMode {
    /// Holds the moment a calendar can be clicked.
    CalendarGrab,
    /// Holds the moment a waitlist mail link arrives.
    WaitlistLinkGrab,
    /// The person at the counter is not the registration.
    DocumentSwap,
    /// The hold is never paid inside the window.
    UnpaidHold,
    /// A still-open category is taken instead of the real one.
    WrongCategory,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Opening {
    CalendarJustOpened,
    WaitlistMailLink,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Ending {
    Counter,
    BackOfQueue,
    TurnedAway,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Phase {
    Opening(Opening),
    Ending(Ending),
}

/// A bare grab stops at the opening. It does not become a counter visit.
pub fn run(mode: AttackMode) -> Phase {
    match mode {
        AttackMode::CalendarGrab => Phase::Opening(Opening::CalendarJustOpened),
        AttackMode::WaitlistLinkGrab => Phase::Opening(Opening::WaitlistMailLink),
        AttackMode::DocumentSwap | AttackMode::UnpaidHold => Phase::Ending(Ending::BackOfQueue),
        AttackMode::WrongCategory => Phase::Ending(Ending::TurnedAway),
    }
}

pub fn mode_name(mode: AttackMode) -> &'static str {
    match mode {
        AttackMode::CalendarGrab => "CalendarGrab",
        AttackMode::WaitlistLinkGrab => "WaitlistLinkGrab",
        AttackMode::DocumentSwap => "DocumentSwap",
        AttackMode::UnpaidHold => "UnpaidHold",
        AttackMode::WrongCategory => "WrongCategory",
    }
}

pub fn phase_name(mode: AttackMode) -> &'static str {
    match run(mode) {
        Phase::Opening(Opening::CalendarJustOpened) => "calendar-opening",
        Phase::Opening(Opening::WaitlistMailLink) => "waitlist-link",
        Phase::Ending(Ending::BackOfQueue) => "back-of-queue",
        Phase::Ending(Ending::TurnedAway) => "turned-away",
        Phase::Ending(Ending::Counter) => "counter",
    }
}
pub fn all_modes() -> [AttackMode; 5] {
    [
        AttackMode::CalendarGrab,
        AttackMode::WaitlistLinkGrab,
        AttackMode::DocumentSwap,
        AttackMode::UnpaidHold,
        AttackMode::WrongCategory,
    ]
}
