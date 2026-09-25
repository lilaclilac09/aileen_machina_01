use std::collections::{HashMap, VecDeque};
use std::net::IpAddr;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use ipnet::IpNet;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Clone)]
pub struct KeyRec {
    pub id: String,
    pub hash: String,
    pub rpm: u32,
    pub daily_tokens: u64,
    pub created_at: u64,
    pub revoked: bool,
    pub from_env: bool,
}

#[derive(Clone)]
struct Use {
    hits: VecDeque<u64>,
    day: u64,
    tokens: u64,
    last_seen: u64,
}

pub struct Vault {
    path: PathBuf,
    keys: Mutex<Vec<KeyRec>>,
    usage: Mutex<HashMap<String, Use>>,
    edge: Mutex<HashMap<String, VecDeque<u64>>>,
}

#[derive(Deserialize)]
struct FileShape {
    #[serde(default)]
    keys: Vec<FileKey>,
}

#[derive(Deserialize)]
struct FileKey {
    id: String,
    #[serde(default)]
    hash: String,
    #[serde(default)]
    key: String,
    #[serde(default)]
    rpm: u32,
    #[serde(default)]
    daily_tokens: u64,
    #[serde(default)]
    created_at: u64,
    #[serde(default)]
    revoked: bool,
}

#[derive(Serialize)]
struct OutFile<'a> {
    keys: Vec<OutKey<'a>>,
}

#[derive(Serialize)]
struct OutKey<'a> {
    id: &'a str,
    hash: &'a str,
    rpm: u32,
    daily_tokens: u64,
    created_at: u64,
    revoked: bool,
}

pub fn sha256_hex(value: &str) -> String {
    let dig = Sha256::digest(value.as_bytes());
    dig.iter().map(|b| format!("{b:02x}")).collect()
}

pub fn ct_eq(a: &str, b: &str) -> bool {
    let (a, b) = (a.as_bytes(), b.as_bytes());
    if a.len() != b.len() || a.is_empty() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

pub fn random_secret(prefix: &str) -> String {
    use uuid::Uuid;
    format!("{prefix}{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple())
}

impl Vault {
    pub fn load(path: PathBuf, bootstrap: &str) -> Self {
        let mut keys = read_file(&path);
        if !bootstrap.is_empty() && !keys.iter().any(|k| ct_eq(&k.hash, &sha256_hex(bootstrap))) {
            keys.insert(
                0,
                KeyRec {
                    id: "owner".into(),
                    hash: sha256_hex(bootstrap),
                    rpm: 60,
                    daily_tokens: 0,
                    created_at: 0,
                    revoked: false,
                    from_env: true,
                },
            );
        }
        Self {
            path,
            keys: Mutex::new(keys),
            usage: Mutex::new(HashMap::new()),
            edge: Mutex::new(HashMap::new()),
        }
    }

    pub fn any(&self) -> bool {
        self.keys.lock().unwrap_or_else(|e| e.into_inner()).iter().any(|k| !k.revoked)
    }

    pub fn setup_open(&self) -> bool {
        !self.path.exists() && !self.any()
    }

    pub fn authorize(&self, bearer: &str) -> Option<String> {
        if bearer.is_empty() {
            return None;
        }
        let hash = sha256_hex(bearer);
        let keys = self.keys.lock().unwrap_or_else(|e| e.into_inner());
        let mut found = None;
        for key in keys.iter() {
            let same = ct_eq(&key.hash, &hash);
            if same && !key.revoked {
                found = Some(key.id.clone());
            }
        }
        found
    }

    pub fn limit(&self, id: &str) -> Option<u64> {
        let keys = self.keys.lock().unwrap_or_else(|e| e.into_inner());
        let key = keys.iter().find(|k| k.id == id)?;
        let rpm = key.rpm;
        let cap = key.daily_tokens;
        drop(keys);
        let now = crate::unix_now();
        let day = now / 86_400;
        let mut usage = self.usage.lock().unwrap_or_else(|e| e.into_inner());
        let row = usage.entry(id.to_string()).or_insert_with(|| Use {
            hits: VecDeque::new(),
            day,
            tokens: 0,
            last_seen: 0,
        });
        if row.day != day {
            row.day = day;
            row.tokens = 0;
        }
        while row.hits.front().is_some_and(|t| now.saturating_sub(*t) >= 60) {
            row.hits.pop_front();
        }
        if rpm > 0 && row.hits.len() as u32 >= rpm {
            let oldest = row.hits.front().copied().unwrap_or(now);
            return Some((60 - now.saturating_sub(oldest)).max(1));
        }
        if cap > 0 && row.tokens >= cap {
            return Some(60);
        }
        row.hits.push_back(now);
        row.last_seen = now;
        None
    }

    pub fn charge(&self, id: &str, tokens: u64) {
        if id.is_empty() || tokens == 0 {
            return;
        }
        let day = crate::unix_now() / 86_400;
        let mut usage = self.usage.lock().unwrap_or_else(|e| e.into_inner());
        let row = usage.entry(id.to_string()).or_insert_with(|| Use {
            hits: VecDeque::new(),
            day,
            tokens: 0,
            last_seen: crate::unix_now(),
        });
        if row.day != day {
            row.day = day;
            row.tokens = 0;
        }
        row.tokens = row.tokens.saturating_add(tokens);
    }

    pub fn edge_ok(&self, bucket: &str, per_min: usize) -> bool {
        let now = crate::unix_now();
        let mut map = self.edge.lock().unwrap_or_else(|e| e.into_inner());
        let row = map.entry(bucket.to_string()).or_default();
        while row.front().is_some_and(|t| now.saturating_sub(*t) >= 60) {
            row.pop_front();
        }
        if row.len() >= per_min {
            return false;
        }
        row.push_back(now);
        true
    }

    pub fn list(&self) -> Vec<serde_json::Value> {
        let keys = self.keys.lock().unwrap_or_else(|e| e.into_inner());
        let usage = self.usage.lock().unwrap_or_else(|e| e.into_inner());
        let now = crate::unix_now();
        keys.iter()
            .map(|key| {
                let row = usage.get(&key.id);
                let rpm_used = row
                    .map(|u| u.hits.iter().filter(|t| now.saturating_sub(**t) < 60).count())
                    .unwrap_or(0);
                serde_json::json!({
                    "id": key.id,
                    "rpm": key.rpm,
                    "rpm_used": rpm_used,
                    "tokens": row.map(|u| u.tokens).unwrap_or(0),
                    "daily_tokens": key.daily_tokens,
                    "last_seen": row.map(|u| u.last_seen).unwrap_or(0),
                    "created_at": key.created_at,
                    "revoked": key.revoked,
                    "from_env": key.from_env,
                })
            })
            .collect()
    }

    pub fn mint(&self, id: &str, rpm: u32, daily_tokens: u64) -> Result<String, String> {
        let id = id.trim();
        if id.is_empty() || id.len() > 32 || !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
            return Err("id must be 1-32 letters, numbers, - or _".into());
        }
        let mut keys = self.keys.lock().unwrap_or_else(|e| e.into_inner());
        if keys.iter().any(|k| k.id == id) {
            return Err("id already exists".into());
        }
        let secret = random_secret("sk-gw-");
        keys.push(KeyRec {
            id: id.to_string(),
            hash: sha256_hex(&secret),
            rpm: if rpm == 0 { 30 } else { rpm },
            daily_tokens,
            created_at: crate::unix_now(),
            revoked: false,
            from_env: false,
        });
        write_file(&self.path, &keys).map_err(|e| e.to_string())?;
        Ok(secret)
    }

    pub fn revoke(&self, id: &str) -> Result<(), String> {
        let mut keys = self.keys.lock().unwrap_or_else(|e| e.into_inner());
        let Some(pos) = keys.iter().position(|k| k.id == id) else {
            return Err("unknown id".into());
        };
        if keys[pos].from_env {
            return Err("bootstrap key lives in GATEWAY_BOOTSTRAP_KEY".into());
        }
        keys[pos].revoked = true;
        write_file(&self.path, &keys).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn set_limits(&self, id: &str, rpm: u32, daily_tokens: u64) -> Result<(), String> {
        let mut keys = self.keys.lock().unwrap_or_else(|e| e.into_inner());
        let Some(key) = keys.iter_mut().find(|k| k.id == id) else {
            return Err("unknown id".into());
        };
        if key.revoked {
            return Err("revoked".into());
        }
        key.rpm = rpm.max(1);
        key.daily_tokens = daily_tokens;
        write_file(&self.path, &keys).map_err(|e| e.to_string())?;
        Ok(())
    }
}

fn read_file(path: &Path) -> Vec<KeyRec> {
    let Ok(text) = std::fs::read_to_string(path) else {
        return Vec::new();
    };
    let Ok(file) = serde_json::from_str::<FileShape>(&text) else {
        eprintln!("keys file ignored: not json");
        return Vec::new();
    };
    let mut out = Vec::new();
    let mut rewrite = false;
    for row in file.keys {
        if row.id.trim().is_empty() {
            continue;
        }
        let hash = if !row.hash.is_empty() {
            row.hash
        } else if !row.key.is_empty() {
            rewrite = true;
            sha256_hex(&row.key)
        } else {
            continue;
        };
        out.push(KeyRec {
            id: row.id,
            hash,
            rpm: if row.rpm == 0 { 30 } else { row.rpm },
            daily_tokens: row.daily_tokens,
            created_at: row.created_at,
            revoked: row.revoked,
            from_env: false,
        });
    }
    if rewrite {
        let _ = write_file(path, &out);
    }
    out
}

fn write_file(path: &Path, keys: &[KeyRec]) -> std::io::Result<()> {
    let body = OutFile {
        keys: keys
            .iter()
            .filter(|k| !k.from_env)
            .map(|k| OutKey {
                id: &k.id,
                hash: &k.hash,
                rpm: k.rpm,
                daily_tokens: k.daily_tokens,
                created_at: k.created_at,
                revoked: k.revoked,
            })
            .collect(),
    };
    if let Some(dir) = path.parent() {
        if !dir.as_os_str().is_empty() {
            std::fs::create_dir_all(dir)?;
        }
    }
    std::fs::write(path, serde_json::to_string_pretty(&body).unwrap_or_else(|_| "{\"keys\":[]}".into()))
}

pub fn parse_nets(raw: &str) -> Vec<IpNet> {
    raw.split(',')
        .filter_map(|part| {
            let part = part.trim();
            if part.is_empty() {
                return None;
            }
            part.parse::<IpNet>().or_else(|_| format!("{part}/{}", if part.contains(':') { 128 } else { 32 }).parse()).ok()
        })
        .collect()
}

pub fn ip_allowed(peer: IpAddr, nets: &[IpNet]) -> bool {
    if peer.is_loopback() {
        return true;
    }
    if nets.is_empty() {
        return false;
    }
    nets.iter().any(|net| net.contains(&peer))
}

pub fn origin_allowed(origin: Option<&str>, allow: &[String]) -> bool {
    let Some(origin) = origin else {
        return true;
    };
    if origin.is_empty() {
        return true;
    }
    allow.iter().any(|item| item == origin)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_and_allow() {
        assert!(ct_eq("abc", "abc"));
        assert!(!ct_eq("abc", "abd"));
        assert!(ip_allowed("127.0.0.1".parse().unwrap(), &[]));
        assert!(!ip_allowed("10.1.1.1".parse().unwrap(), &[]));
        let nets = parse_nets("100.64.0.0/10");
        assert!(ip_allowed("100.64.1.8".parse().unwrap(), &nets));
        assert!(!ip_allowed("8.8.8.8".parse().unwrap(), &nets));
        assert!(origin_allowed(None, &[]));
        assert!(!origin_allowed(Some("https://evil.example"), &[]));
    }
}
