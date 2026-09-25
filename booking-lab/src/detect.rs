use crate::{BookRequest, CalendarQuery, DetectVerdict};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DetectConfig {
    pub calendar_window_secs: u64,
    pub calendar_burst_max: usize,
    pub reserved_botnet_prefix: String,
}

impl Default for DetectConfig {
    fn default() -> Self {
        Self {
            calendar_window_secs: 10,
            calendar_burst_max: 8,
            reserved_botnet_prefix: "203.0.113.".into(),
        }
    }
}

pub fn on_calendar(hits_in_window: usize, q: &CalendarQuery, cfg: &DetectConfig) -> DetectVerdict {
    if q.ip.starts_with(&cfg.reserved_botnet_prefix) {
        return DetectVerdict {
            allow: false,
            reason: "test-reserved-botnet-range".into(),
            score: 80,
        };
    }
    if hits_in_window > cfg.calendar_burst_max {
        return DetectVerdict {
            allow: false,
            reason: "calendar-burst".into(),
            score: 70,
        };
    }
    DetectVerdict {
        allow: true,
        reason: "ok".into(),
        score: 0,
    }
}

pub fn on_book(req: &BookRequest) -> DetectVerdict {
    if req.applicant.trim().is_empty() {
        return DetectVerdict {
            allow: false,
            reason: "empty-applicant".into(),
            score: 90,
        };
    }
    DetectVerdict {
        allow: true,
        reason: "ok".into(),
        score: 0,
    }
}
