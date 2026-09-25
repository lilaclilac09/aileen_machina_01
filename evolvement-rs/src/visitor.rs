use uuid::Uuid;

use crate::memory::soft::Visitor;
use crate::sell::routes::{lang_of, topics_from};

pub fn ensure_id(given: &str) -> String {
    let id = given.trim();
    if id.is_empty() {
        format!("vis_{}", Uuid::new_v4().simple())
    } else if id.starts_with("vis_") {
        id.to_string()
    } else {
        format!("vis_{id}")
    }
}

pub fn fold_visitor(existing: Option<Visitor>, id: &str, message: &str, prior: &[String]) -> Visitor {
    let mut visitor = existing.unwrap_or_else(|| Visitor::new(id));
    visitor.id = id.to_string();
    let mut topics = topics_from(message);
    for topic in prior {
        let t = topic.trim();
        if !t.is_empty() && !topics.iter().any(|x| x == t) {
            topics.push(t.to_string());
        }
    }
    visitor.note_ask(message, &topics, lang_of(message));
    visitor
}
