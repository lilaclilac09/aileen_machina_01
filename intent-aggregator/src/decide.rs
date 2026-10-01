use serde_json::Value;

use crate::questions::Scenario;

pub const ESCALATE_NOUL: f64 = 0.7;
pub const URGENT_SCORE: f64 = 2.0;
pub const LOW_CONFIDENCE: f64 = 0.5;
pub const REVISE_NOUL: f64 = 0.7;
pub const HIGH_RESISTANCE: f64 = 2.0;
pub const APPROVE_RESISTANCE: f64 = 1.0;
pub const APPROVE_REVISION: f64 = 0.5;

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

fn customer(answers: &serde_json::Map<String, Value>) -> String {
    let (Some(human), Some(urgency), Some((intent, confidence))) = (
        noul(answers, "needs_human"),
        score(answers, "urgency"),
        choice(answers, "intent"),
    ) else {
        return "follow_up".into();
    };
    if human >= ESCALATE_NOUL {
        return "escalate_human".into();
    }
    if intent == "complaint" || intent == "refund" {
        if urgency >= URGENT_SCORE {
            return "escalate_human".into();
        }
        return "create_ticket".into();
    }
    if intent == "undecided" || confidence < LOW_CONFIDENCE {
        return "follow_up".into();
    }
    if intent == "purchase" || intent == "price_comparison" {
        return "follow_up".into();
    }
    "auto_reply".into()
}

fn meeting(answers: &serde_json::Map<String, Value>) -> String {
    let (Some((stance, confidence)), Some(resistance), Some(revision)) = (
        choice(answers, "stance"),
        score(answers, "resistance"),
        noul(answers, "wants_revision"),
    ) else {
        return "shelve".into();
    };
    if stance == "oppose" && resistance >= HIGH_RESISTANCE {
        return "escalate".into();
    }
    if stance == "oppose" {
        return "shelve".into();
    }
    if revision >= REVISE_NOUL || stance == "skeptical" {
        return "revise".into();
    }
    if stance == "undecided" || confidence < LOW_CONFIDENCE {
        return "shelve".into();
    }
    if stance == "support" && resistance < APPROVE_RESISTANCE && revision < APPROVE_REVISION {
        return "approve".into();
    }
    "revise".into()
}

fn ticket(answers: &serde_json::Map<String, Value>) -> String {
    let (Some((department, confidence)), Some(urgent)) = (
        choice(answers, "department"),
        noul(answers, "is_urgent"),
    ) else {
        return "hold".into();
    };
    if department == "undecided" || confidence < LOW_CONFIDENCE {
        return "hold".into();
    }
    if urgent >= ESCALATE_NOUL {
        return format!("urgent_{department}");
    }
    format!("route_{department}")
}

pub fn suggested_action(scenario: Scenario, answers: &serde_json::Map<String, Value>) -> String {
    match scenario {
        Scenario::Customer => customer(answers),
        Scenario::Meeting => meeting(answers),
        Scenario::Ticket => ticket(answers),
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
    fn urgent_refund_ignores_model_next_action() {
        let answers = map(json!({
            "intent": { "choice": "refund", "confidence": 0.9 },
            "urgency": { "score": 2.4 },
            "needs_human": { "noul": 0.4 },
            "next_action": { "choice": "auto_reply", "confidence": 0.99 }
        }));
        assert_eq!(suggested_action(Scenario::Customer, &answers), "escalate_human");
    }

    #[test]
    fn calm_inquiry_auto_replies() {
        let answers = map(json!({
            "intent": { "choice": "inquiry", "confidence": 0.8 },
            "urgency": { "score": 0.2 },
            "needs_human": { "noul": 0.1 }
        }));
        assert_eq!(suggested_action(Scenario::Customer, &answers), "auto_reply");
    }

    #[test]
    fn meeting_approve_and_ticket_route() {
        let meeting = map(json!({
            "stance": { "choice": "support", "confidence": 0.9 },
            "resistance": { "score": 0.2 },
            "wants_revision": { "noul": 0.1 }
        }));
        assert_eq!(suggested_action(Scenario::Meeting, &meeting), "approve");

        let ticket = map(json!({
            "department": { "choice": "billing", "confidence": 0.88 },
            "is_urgent": { "noul": 0.95 }
        }));
        assert_eq!(suggested_action(Scenario::Ticket, &ticket), "urgent_billing");
    }
}
