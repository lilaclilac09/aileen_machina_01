use std::fmt;

#[derive(Debug)]
pub enum EvolError {
    Io(std::io::Error),
    RedisDown,
    NotAllowlisted(String),
    BadPath(String),
    Msg(String),
}

impl fmt::Display for EvolError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EvolError::Io(e) => write!(f, "{e}"),
            EvolError::RedisDown => write!(f, "redis down"),
            EvolError::NotAllowlisted(p) => write!(f, "not allowlisted: {p}"),
            EvolError::BadPath(p) => write!(f, "bad path: {p}"),
            EvolError::Msg(m) => write!(f, "{m}"),
        }
    }
}

impl std::error::Error for EvolError {}

impl From<std::io::Error> for EvolError {
    fn from(value: std::io::Error) -> Self {
        EvolError::Io(value)
    }
}

pub type EvolResult<T> = Result<T, EvolError>;
