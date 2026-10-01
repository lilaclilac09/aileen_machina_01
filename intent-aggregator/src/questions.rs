use indexmap::IndexMap;
use serde::Serialize;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Scenario {
    Customer,
    Meeting,
    Ticket,
}

impl Scenario {
    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "customer" => Some(Self::Customer),
            "meeting" => Some(Self::Meeting),
            "ticket" => Some(Self::Ticket),
            _ => None,
        }
    }
}

#[derive(Serialize)]
pub struct NoulCriteria {
    #[serde(rename = "true")]
    pub yes: &'static str,
    #[serde(rename = "false")]
    pub no: &'static str,
}

#[derive(Serialize)]
#[serde(tag = "type")]
pub enum Question {
    #[serde(rename = "choice")]
    Choice {
        instructions: &'static str,
        criteria: IndexMap<&'static str, &'static str>,
    },
    #[serde(rename = "score")]
    Score {
        instructions: &'static str,
        criteria: Vec<&'static str>,
    },
    #[serde(rename = "noul")]
    Noul {
        instructions: &'static str,
        criteria: NoulCriteria,
    },
}

fn choice(instructions: &'static str, pairs: &[(&'static str, &'static str)]) -> Question {
    Question::Choice {
        instructions,
        criteria: pairs.iter().copied().collect(),
    }
}

fn noul(instructions: &'static str, yes: &'static str, no: &'static str) -> Question {
    Question::Noul {
        instructions,
        criteria: NoulCriteria { yes, no },
    }
}

pub fn questions_for(scenario: Scenario) -> IndexMap<&'static str, Question> {
    let mut map = IndexMap::new();
    match scenario {
        Scenario::Customer => {
            map.insert(
                "intent",
                choice(
                    "What does this person want from us?",
                    &[
                        ("purchase", "They want to buy, subscribe, or are ready to pay."),
                        ("inquiry", "They are asking how something works, with no buy or complaint ask."),
                        ("complaint", "They are unhappy with a product or experience and want it fixed."),
                        ("refund", "They want money returned."),
                        ("price_comparison", "They are comparing a price or asking whether a price is fair."),
                        ("chitchat", "Greeting or small talk with no request."),
                        ("undecided", "The text does not support one of the other labels."),
                    ],
                ),
            );
            map.insert(
                "urgency",
                Question::Score {
                    instructions: "How urgent is this message?",
                    criteria: vec![
                        "0 not urgent — no time pressure",
                        "1 low — can wait",
                        "2 urgent — wants a response soon",
                        "3 very urgent — immediate harm, a deadline, or repeated escalation",
                    ],
                },
            );
            map.insert(
                "needs_human",
                noul(
                    "Should a human take this, rather than an automatic reply?",
                    "A person should take it: money, anger, policy, or ambiguity a template cannot close.",
                    "A stock reply or a ticket is enough.",
                ),
            );
            map.insert(
                "next_action",
                choice(
                    "Which single next step fits this message?",
                    &[
                        ("auto_reply", "A prepared reply answers it."),
                        ("create_ticket", "It should be tracked, and does not need a person right now."),
                        ("escalate_human", "A person should take it now."),
                        ("follow_up", "Someone should come back to it, but not as an emergency."),
                        ("undecided", "The text does not support one of the other steps."),
                    ],
                ),
            );
        }
        Scenario::Meeting => {
            map.insert(
                "stance",
                choice(
                    "What stance does this text take on the proposal?",
                    &[
                        ("support", "They are for the proposal."),
                        ("skeptical", "They are not against it, but they are not convinced."),
                        ("oppose", "They are against the proposal."),
                        ("undecided", "The text does not support support, skeptical, or oppose."),
                    ],
                ),
            );
            map.insert(
                "resistance",
                Question::Score {
                    instructions: "How strong is the resistance in this text?",
                    criteria: vec![
                        "0 no resistance",
                        "1 mild questions or hesitation",
                        "2 clear pushback",
                        "3 strongly opposed",
                    ],
                },
            );
            map.insert(
                "wants_revision",
                noul(
                    "Is a substantive revision being requested?",
                    "They want the substance changed, not a wording tweak.",
                    "They are not asking for a substantive revision.",
                ),
            );
            map.insert(
                "next_action",
                choice(
                    "Which single next step fits this read of the room?",
                    &[
                        ("approve", "Proceed as proposed."),
                        ("revise", "Change the proposal and bring it back."),
                        ("shelve", "Do not proceed now."),
                        ("escalate", "Someone with more authority should decide."),
                        ("undecided", "The text does not support one of the other steps."),
                    ],
                ),
            );
        }
        Scenario::Ticket => {
            map.insert(
                "department",
                choice(
                    "Which team should handle this ticket?",
                    &[
                        ("billing", "Payment, invoice, refund, or plan charges."),
                        ("technical", "A bug, outage, or how the product behaves."),
                        ("sales", "A new purchase, upgrade, or commercial question."),
                        ("undecided", "The text does not support billing, technical, or sales."),
                    ],
                ),
            );
            map.insert(
                "is_urgent",
                noul(
                    "Is this ticket urgent?",
                    "There is a deadline, an outage, or someone is blocked now.",
                    "It can wait for the normal queue.",
                ),
            );
        }
    }
    map
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn customer_intent_options_keep_spec_order() {
        let questions = questions_for(Scenario::Customer);
        let raw = serde_json::to_string(questions.get("intent").unwrap()).unwrap();
        let at = |key: &str| raw.find(&format!("\"{key}\"")).unwrap();
        let order = [
            "purchase",
            "inquiry",
            "complaint",
            "refund",
            "price_comparison",
            "chitchat",
            "undecided",
        ];
        let positions: Vec<_> = order.iter().map(|key| at(key)).collect();
        assert!(positions.windows(2).all(|pair| pair[0] < pair[1]), "{raw}");
        assert!(raw.contains("\"type\":\"choice\""));

        let noul = serde_json::to_value(questions.get("needs_human").unwrap()).unwrap();
        assert_eq!(noul["type"], "noul");
        assert!(noul.get("confidence").is_none());
        let urgency = serde_json::to_value(questions.get("urgency").unwrap()).unwrap();
        assert_eq!(urgency["criteria"].as_array().unwrap().len(), 4);
    }
}
