use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::decide::{purchase_confidence, RISK_SAFE_NOUL};
use crate::jev::{call_jev, JevError};
use crate::questions::Question;

/// Second Jev call for a confident purchase. This never moves money.
/// The x402 / Mercator payment step is outside this crate. We only return
/// the signed-off intent object when every risk noul is below RISK_SAFE_NOUL.

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Limits {
    pub budget: f64,
    pub preauthorized: f64,
    pub item: String,
    pub amount: f64,
    pub currency: String,
}

#[derive(Debug, Serialize)]
pub struct PaymentIntent {
    pub item: String,
    pub amount: f64,
    pub currency: String,
    pub confidence: f64,
    pub risk_answers: HashMap<String, Value>,
}

#[derive(Debug)]
pub enum PurchaseReview {
    NotPurchase,
    Manual,
    Ready(PaymentIntent),
}

fn risk_questions() -> indexmap::IndexMap<&'static str, Question> {
    let mut map = indexmap::IndexMap::new();
    map.insert(
        "matches_budget",
        crate::questions::noul(
            "Does this purchase match the user's stated budget?",
            "The text and the passed-in budget describe the same purchase.",
            "The text does not match the stated budget, or there is not enough evidence.",
        ),
    );
    map.insert(
        "within_preauthorized",
        crate::questions::noul(
            "Is the amount within the pre-authorized limit?",
            "The passed-in amount is within the pre-authorized limit.",
            "The amount is over the limit, or there is not enough evidence.",
        ),
    );
    map
}

pub fn review_from_answers(
    confidence: f64,
    limits: &Limits,
    risk_answers: &HashMap<String, Value>,
) -> PurchaseReview {
    let safe = ["matches_budget", "within_preauthorized"].into_iter().all(|id| {
        risk_answers
            .get(id)
            .and_then(Value::as_object)
            .and_then(|row| row.get("noul"))
            .and_then(Value::as_f64)
            .is_some_and(|noul| noul < RISK_SAFE_NOUL)
    });
    if !safe {
        return PurchaseReview::Manual;
    }
    PurchaseReview::Ready(PaymentIntent {
        item: limits.item.clone(),
        amount: limits.amount,
        currency: limits.currency.clone(),
        confidence,
        risk_answers: risk_answers.clone(),
    })
}

pub async fn review_purchase(
    text: &str,
    answers: &serde_json::Map<String, Value>,
    limits: Option<&Limits>,
) -> Result<PurchaseReview, JevError> {
    let Some(confidence) = purchase_confidence(answers) else {
        return Ok(PurchaseReview::NotPurchase);
    };
    let Some(limits) = limits else {
        return Ok(PurchaseReview::Manual);
    };
    let state = json!({
        "scenario": "customer",
        "text": text,
        "limits": limits,
    });
    let risk_answers = call_jev(&state, &risk_questions()).await?;
    Ok(review_from_answers(confidence, limits, &risk_answers))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn limits() -> Limits {
        Limits {
            budget: 200.0,
            preauthorized: 150.0,
            item: "耳机".into(),
            amount: 89.0,
            currency: "CNY".into(),
        }
    }

    #[test]
    fn safe_nouls_are_ready_to_pay_without_moving_money() {
        let mut risk_answers = HashMap::new();
        risk_answers.insert("matches_budget".into(), json!({ "type": "noul", "noul": 0.1 }));
        risk_answers.insert("within_preauthorized".into(), json!({ "type": "noul", "noul": 0.2 }));
        match review_from_answers(0.91, &limits(), &risk_answers) {
            PurchaseReview::Ready(intent) => {
                assert_eq!(intent.item, "耳机");
                assert_eq!(intent.amount, 89.0);
                assert_eq!(intent.currency, "CNY");
            }
            other => panic!("expected ready, got {other:?}"),
        }
    }

    #[test]
    fn a_risk_noul_at_the_line_stays_manual() {
        let mut risk_answers = HashMap::new();
        risk_answers.insert("matches_budget".into(), json!({ "type": "noul", "noul": 0.3 }));
        risk_answers.insert("within_preauthorized".into(), json!({ "type": "noul", "noul": 0.1 }));
        assert!(matches!(
            review_from_answers(0.91, &limits(), &risk_answers),
            PurchaseReview::Manual
        ));
    }
}
