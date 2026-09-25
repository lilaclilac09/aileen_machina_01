use crate::{Account, Session};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    inner: Arc<Mutex<Inner>>,
}

struct Inner {
    accounts: HashMap<String, Account>,
    sessions: HashMap<String, Session>,
    cal_hits: HashMap<String, Vec<Instant>>,
    booked: HashMap<String, String>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(Inner {
                accounts: HashMap::new(),
                sessions: HashMap::new(),
                cal_hits: HashMap::new(),
                booked: HashMap::new(),
            })),
        }
    }

    pub fn register(&self, email: String) -> Account {
        let acc = Account {
            id: Uuid::new_v4().to_string(),
            email,
        };
        let mut g = self.inner.lock().unwrap();
        g.accounts.insert(acc.id.clone(), acc.clone());
        acc
    }

    /// Local token only. Nothing is emailed.
    pub fn login_test(&self, account_id: &str) -> Session {
        let s = Session {
            token: Uuid::new_v4().to_string(),
            account_id: account_id.to_string(),
        };
        let mut g = self.inner.lock().unwrap();
        g.sessions.insert(s.token.clone(), s.clone());
        s
    }

    pub fn reset_drill(&self) {
        let mut g = self.inner.lock().unwrap();
        g.cal_hits.clear();
        g.booked.clear();
    }

    pub fn record_calendar_at(&self, ip: &str, at: Instant, window: Duration) -> usize {
        let mut g = self.inner.lock().unwrap();
        let hits = g.cal_hits.entry(ip.to_string()).or_default();
        hits.retain(|t| at.duration_since(*t) < window);
        hits.push(at);
        hits.len()
    }

    pub fn try_book(&self, slot: &str, applicant: &str) -> Result<(), &'static str> {
        let mut g = self.inner.lock().unwrap();
        if g.booked.contains_key(slot) {
            return Err("slot taken");
        }
        g.booked.insert(slot.to_string(), applicant.to_string());
        Ok(())
    }
}
