use serde_json::Value;

use crate::questions::Scenario;

/// Every threshold lives in this module. Branching reads these names only.
pub const LOW_CONFIDENCE: f64 = 0.5;
pub const NEEDS_HUMAN_NOUL: f64 = 0.7;
pub const WANTS_REVISION_NOUL: f64 = 0.7;
pub const IS_URGENT_NOUL: f64 = 0.7;
pub const PURCHASE_READY_CONFIDENCE: f64 = 0.8;
pub const RISK_SAFE_NOUL: f64 = 0.3;
/// Customer complaint/refund with urgency at or above this becomes escalate_human.
pub const URGENT_SCORE: f64 = 2.0;
/// Meeting support with resistance below this, and no revision ask, becomes approve.
pub const QUIET_RESISTANCE: f64 = 1.0;

#[derive(Debug, PartialEq, Eq)]
pub struct Decision {
    pub suggested_action: String,
    pub low_confidence: Vec<String>,
}

fn choice(answers: &serde_json::Map<String, Value>, id: &str) -> Option<(String, f64)> {
    let row = answers.get(id)?.as_object()?;
    let choice = row.get("choice")?.as_str()?.to_string();
    let confidence = row.get("confidence").and_then(Value::as_f64).unwrap_or(0.0);
    Some((choice, confidence))
}

fn score(answers: &serde_json::Map<String, Value>, id: &str) -> Option<f64> {
    answers.get(id)?.as_object()?.get("score")?.as_f64()
}

fn noul(answers: &serde_json::Map<String, Value>, id: &str) -> Option<f64> {
    answers.get(id)?.as_object()?.get("noul")?.as_f64()
}

fn low_confidence_ids(answers: &serde_json::Map<String, Value>) -> Vec<String> {
    let mut ids = Vec::new();
    for (id, value) in answers {
        let Some(confidence) = value
            .as_object()
            .and_then(|row| row.get("confidence"))
            .and_then(Value::as_f64)
        else {
            continue;
        };
        if confidence < LOW_CONFIDENCE {
            ids.push(id.clone());
        }
    }
    ids
}

/// Fallback when no gate fires. The model's next_action is ignored.
///
/// customer intent:
/// - purchase, price_comparison → follow_up (risk.rs may replace a confident purchase)
/// - inquiry, chitchat → auto_reply
/// - complaint, refund → create_ticket; urgency score >= URGENT_SCORE → escalate_human
/// - undecided, or a missing intent → review_manually
///
/// meeting stance:
/// - support and resistance < QUIET_RESISTANCE → approve
/// - skeptical → prepare_revision
/// - oppose → shelve
/// - undecided, or a missing stance → review_manually
///
/// ticket department:
/// - billing / technical / sales → route_<department>
/// - undecided, or a missing department → review_manually
fn map_scenario(scenario: Scenario, answers: &serde_json::Map<String, Value>) -> String {
    match scenario {
        Scenario::Customer => {
            let Some((intent, _)) = choice(answers, "intent") else {
                return "review_manually".into();
            };
            let urgency = score(answers, "urgency").unwrap_or(0.0);
            match intent.as_str() {
                "purchase" | "price_comparison" => "follow_up".into(),
                "inquiry" | "chitchat" => "auto_reply".into(),
                "complaint" | "refund" if urgency >= URGENT_SCORE => "escalate_human".into(),
                "complaint" | "refund" => "create_ticket".into(),
                _ => "review_manually".into(),
            }
        }
        Scenario::Meeting => {
            let Some((stance, _)) = choice(answers, "stance") else {
                return "review_manually".into();
            };
            let resistance = score(answers, "resistance").unwrap_or(0.0);
            match stance.as_str() {
                "support" if resistance < QUIET_RESISTANCE => "approve".into(),
                "support" | "skeptical" => "prepare_revision".into(),
                "oppose" => "shelve".into(),
                _ => "review_manually".into(),
            }
        }
        Scenario::Ticket => {
            let Some((department, _)) = choice(answers, "department") else {
                return "review_manually".into();
            };
            match department.as_str() {
                "billing" | "technical" | "sales" => format!("route_{department}"),
                _ => "review_manually".into(),
            }
        }
    }
}

pub fn decide(scenario: Scenario, answers: &serde_json::Map<String, Value>) -> Decision {
    let low_confidence = low_confidence_ids(answers);
    if !low_confidence.is_empty() {
        return Decision {
            suggested_action: "review_manually".into(),
            low_confidence,
        };
    }
    if noul(answers, "needs_human").is_some_and(|value| value > NEEDS_HUMAN_NOUL) {
        return Decision {
            suggested_action: "escalate_human".into(),
            low_confidence,
        };
    }
    if noul(answers, "wants_revision").is_some_and(|value| value > WANTS_REVISION_NOUL) {
        return Decision {
            suggested_action: "prepare_revision".into(),
            low_confidence,
        };
    }
    if noul(answers, "is_urgent").is_some_and(|value| value > IS_URGENT_NOUL) {
        return Decision {
            suggested_action: "handle_immediately".into(),
            low_confidence,
        };
    }
    Decision {
        suggested_action: map_scenario(scenario, answers),
        low_confidence,
    }
}

pub fn purchase_confidence(answers: &serde_json::Map<String, Value>) -> Option<f64> {
    let (intent, confidence) = choice(answers, "intent")?;
    if intent == "purchase" && confidence > PURCHASE_READY_CONFIDENCE {
        Some(confidence)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn map(value: Value) -> serde_json::Map<String, Value> {
        value.as_object().unwrap().clone()
    }

    #[test]
    fn low_confidence_forces_review_and_flags_the_question() {
        let answers = map(json!({
            "intent": { "choice": "refund", "confidence": 0.4 },
            "urgency": { "score": 3.0, "confidence": 0.9 },
            "needs_human": { "noul": 0.95 },
            "next_action": { "choice": "auto_reply", "confidence": 0.99 }
        }));
        let decision = decide(Scenario::Customer, &answers);
        assert_eq!(decision.suggested_action, "review_manually");
        assert_eq!(decision.low_confidence, vec!["intent".to_string()]);
    }

    #[test]
    fn needs_human_escalates_when_confidence_holds() {
        let answers = map(json!({
            "intent": { "choice": "inquiry", "confidence": 0.9 },
            "urgency": { "score": 0.2, "confidence": 0.8 },
            "needs_human": { "noul": 0.71 },
            "next_action": { "choice": "auto_reply", "confidence": 0.9 }
        }));
        assert_eq!(decide(Scenario::Customer, &answers).suggested_action, "escalate_human");
    }

    #[test]
    fn urgent_refund_and_quiet_paths() {
        let refund = map(json!({
            "intent": { "choice": "refund", "confidence": 0.9 },
            "urgency": { "score": 2.4, "confidence": 0.8 },
            "needs_human": { "noul": 0.4 },
            "next_action": { "choice": "auto_reply", "confidence": 0.99 }
        }));
        assert_eq!(decide(Scenario::Customer, &refund).suggested_action, "escalate_human");

        let inquiry = map(json!({
            "intent": { "choice": "inquiry", "confidence": 0.8 },
            "urgency": { "score": 0.2, "confidence": 0.8 },
            "needs_human": { "noul": 0.1 }
        }));
        assert_eq!(decide(Scenario::Customer, &inquiry).suggested_action, "auto_reply");
    }

    #[test]
    fn meeting_and_ticket_gates() {
        let meeting = map(json!({
            "stance": { "choice": "support", "confidence": 0.9 },
            "resistance": { "score": 0.2, "confidence": 0.8 },
            "wants_revision": { "noul": 0.1 },
            "next_action": { "choice": "approve", "confidence": 0.9 }
        }));
        assert_eq!(decide(Scenario::Meeting, &meeting).suggested_action, "approve");

        let revise = map(json!({
            "stance": { "choice": "support", "confidence": 0.9 },
            "resistance": { "score": 0.2, "confidence": 0.8 },
            "wants_revision": { "noul": 0.71 },
            "next_action": { "choice": "approve", "confidence": 0.9 }
        }));
        assert_eq!(decide(Scenario::Meeting, &revise).suggested_action, "prepare_revision");

        let ticket = map(json!({
            "department": { "choice": "billing", "confidence": 0.88 },
            "is_urgent": { "noul": 0.95 }
        }));
        assert_eq!(decide(Scenario::Ticket, &ticket).suggested_action, "handle_immediately");
    }
}
