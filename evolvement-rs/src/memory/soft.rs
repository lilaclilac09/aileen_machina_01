use serde::{Deserialize, Serialize};

use crate::error::{EvolError, EvolResult};

pub const SOFT_TTL_SECS: u64 = 7_776_000;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Ask {
    pub t: String,
    pub q: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Visitor {
    pub id: String,
    pub seen_at: Vec<String>,
    pub topics: Vec<String>,
    pub asks: Vec<Ask>,
    pub repos_shown: Vec<String>,
    pub evolvement_pitch_shown: bool,
    pub lang: String,
}

impl Visitor {
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            seen_at: Vec::new(),
            topics: Vec::new(),
            asks: Vec::new(),
            repos_shown: Vec::new(),
            evolvement_pitch_shown: false,
            lang: "en".into(),
        }
    }

    pub fn note_ask(&mut self, q: &str, topics: &[String], lang: &str) {
        let now = chrono::Utc::now().to_rfc3339();
        self.seen_at.push(now.clone());
        if self.seen_at.len() > 30 {
            let drop_n = self.seen_at.len() - 30;
            self.seen_at.drain(0..drop_n);
        }
        self.asks.push(Ask {
            t: now,
            q: q.chars().take(240).collect(),
        });
        if self.asks.len() > 30 {
            let drop_n = self.asks.len() - 30;
            self.asks.drain(0..drop_n);
        }
        for topic in topics {
            if !self.topics.iter().any(|t| t == topic) {
                self.topics.push(topic.clone());
            }
        }
        if self.topics.len() > 12 {
            let drop_n = self.topics.len() - 12;
            self.topics.drain(0..drop_n);
        }
        if !lang.is_empty() {
            self.lang = lang.into();
        }
    }
}

#[async_trait::async_trait]
pub trait SoftStore: Send + Sync {
    async fn load(&self, id: &str) -> EvolResult<Option<Visitor>>;
    async fn save(&self, visitor: &Visitor) -> EvolResult<()>;
}

/// Used when Redis is unset or the connection fails. No files are written.
pub struct DownSoft;

#[async_trait::async_trait]
impl SoftStore for DownSoft {
    async fn load(&self, _id: &str) -> EvolResult<Option<Visitor>> {
        Err(EvolError::RedisDown)
    }

    async fn save(&self, _visitor: &Visitor) -> EvolResult<()> {
        Err(EvolError::RedisDown)
    }
}

pub struct RedisSoft {
    url: String,
}

impl RedisSoft {
    pub fn new(url: impl Into<String>) -> Self {
        Self { url: url.into() }
    }
}

#[async_trait::async_trait]
impl SoftStore for RedisSoft {
    async fn load(&self, id: &str) -> EvolResult<Option<Visitor>> {
        let mut con = connect(&self.url).await?;
        let key = soft_key(id);
        let raw: Option<String> = redis::cmd("GET")
            .arg(&key)
            .query_async(&mut con)
            .await
            .map_err(|_| EvolError::RedisDown)?;
        match raw {
            Some(text) => serde_json::from_str(&text).map(Some).map_err(|e| EvolError::Msg(e.to_string())),
            None => Ok(None),
        }
    }

    async fn save(&self, visitor: &Visitor) -> EvolResult<()> {
        let mut con = connect(&self.url).await?;
        let key = soft_key(&visitor.id);
        let body = serde_json::to_string(visitor).map_err(|e| EvolError::Msg(e.to_string()))?;
        let _: String = redis::cmd("SET")
            .arg(&key)
            .arg(body)
            .arg("EX")
            .arg(SOFT_TTL_SECS)
            .query_async(&mut con)
            .await
            .map_err(|_| EvolError::RedisDown)?;
        Ok(())
    }
}

/// GET visitor:soft:{id}, append the ask, refresh the 90-day TTL.
pub async fn touch(
    redis: &mut redis::aio::MultiplexedConnection,
    id: &str,
    ask: &str,
) -> EvolResult<Visitor> {
    let key = soft_key(id);
    let raw: Option<String> = redis::cmd("GET")
        .arg(&key)
        .query_async(redis)
        .await
        .map_err(|_| EvolError::RedisDown)?;
    let mut visitor = match raw {
        Some(text) => serde_json::from_str(&text).unwrap_or_else(|_| Visitor::new(id)),
        None => Visitor::new(id),
    };
    visitor.id = id.to_string();
    let topics = crate::sell::routes::topics_from(ask);
    let lang = crate::sell::routes::lang_of(ask);
    visitor.note_ask(ask, &topics, lang);
    let body = serde_json::to_string(&visitor).map_err(|e| EvolError::Msg(e.to_string()))?;
    let _: String = redis::cmd("SET")
        .arg(&key)
        .arg(body)
        .arg("EX")
        .arg(SOFT_TTL_SECS)
        .query_async(redis)
        .await
        .map_err(|_| EvolError::RedisDown)?;
    Ok(visitor)
}

pub fn soft_key(id: &str) -> String {
    format!("visitor:soft:{id}")
}

async fn connect(url: &str) -> EvolResult<redis::aio::MultiplexedConnection> {
    let client = redis::Client::open(url).map_err(|_| EvolError::RedisDown)?;
    client
        .get_multiplexed_async_connection()
        .await
        .map_err(|_| EvolError::RedisDown)
}

/// Client can keep `priorTopics` when Redis is down. This patch is not a file write.
pub fn soft_patch(visitor: &Visitor) -> serde_json::Value {
    serde_json::json!({
        "id": visitor.id,
        "topics": visitor.topics,
        "lang": visitor.lang,
        "evolvement_pitch_shown": visitor.evolvement_pitch_shown,
        "degraded": true,
    })
}
