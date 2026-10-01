pub mod detect;
pub mod kyc;
pub mod modes;
pub mod page;
pub mod state;
pub mod traffic;

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Account {
    pub id: String,
    pub email: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Session {
    pub token: String,
    pub account_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CalendarQuery {
    pub session: String,
    pub ip: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BookRequest {
    pub session: String,
    pub ip: String,
    pub slot: String,
    pub applicant: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct DetectVerdict {
    pub allow: bool,
    pub reason: String,
    pub score: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProfileCount {
    pub sent: u32,
    pub allowed: u32,
    pub blocked: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DrillReport {
    pub human: ProfileCount,
    pub script: ProfileCount,
    pub bulk: ProfileCount,
    pub human_pass_rate: f64,
    pub script_catch_rate: f64,
    pub bulk_catch_rate: f64,
}
