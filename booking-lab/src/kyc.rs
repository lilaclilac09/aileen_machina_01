use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

/// Production visa hosts. A staging name from the other party must not be one of these.
const PRODUCTION_BANNED: &[&str] = &[
    "vfsglobal.com",
    "usvisa-info.com",
    "travel.state.gov",
    "diplo.de",
    "tlscontact.com",
];

#[derive(Clone, Debug)]
pub struct Mail {
    pub to: String,
    pub link: String,
    pub code: String,
}

#[derive(Clone)]
pub struct Kyc {
    inner: Arc<Mutex<Inner>>,
}

struct Inner {
    /// The other party turns the test code on or off.
    otp_enabled: bool,
    pending: HashMap<String, String>,
    outbox: Vec<Mail>,
}

impl Kyc {
    pub fn new(otp_enabled: bool) -> Self {
        Self {
            inner: Arc::new(Mutex::new(Inner {
                otp_enabled,
                pending: HashMap::new(),
                outbox: Vec::new(),
            })),
        }
    }

    pub fn set_otp_enabled(&self, on: bool) {
        self.inner.lock().unwrap().otp_enabled = on;
    }

    /// Local link plus a copy in the lab outbox. The HTTP response does not contain the code.
    /// The person who owns the test mailbox types the code back.
    pub fn issue(&self, account_id: &str, email: &str) -> Result<String, &'static str> {
        let mut g = self.inner.lock().unwrap();
        if !g.otp_enabled {
            return Err("otp-off");
        }
        let token = Uuid::new_v4().to_string();
        let code = format!("{:06}", (token.as_bytes()[0] as u32) * 17 % 1_000_000);
        let link = format!("http://127.0.0.1:18080/kyc/{token}");
        g.pending.insert(token.clone(), code.clone());
        g.outbox.push(Mail {
            to: email.to_string(),
            link: link.clone(),
            code,
        });
        let _ = account_id;
        Ok(link)
    }

    pub fn confirm(&self, token: &str, code: &str) -> Result<(), &'static str> {
        let mut g = self.inner.lock().unwrap();
        match g.pending.get(token) {
            Some(expected) if expected == code.trim() => {
                g.pending.remove(token);
                Ok(())
            }
            Some(_) => Err("code-mismatch"),
            None => Err("unknown-token"),
        }
    }

    pub fn outbox(&self) -> Vec<Mail> {
        self.inner.lock().unwrap().outbox.clone()
    }
}

pub fn host_allowed(host: &str, allow: &[&str]) -> bool {
    let host = host.trim().trim_end_matches('.').to_ascii_lowercase();
    if PRODUCTION_BANNED
        .iter()
        .any(|banned| host == *banned || host.ends_with(&format!(".{banned}")))
    {
        return false;
    }
    if host == "127.0.0.1" || host == "localhost" {
        return true;
    }
    allow.iter().any(|item| item.eq_ignore_ascii_case(&host))
}
