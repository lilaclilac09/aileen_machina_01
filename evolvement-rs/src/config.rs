use std::path::PathBuf;

#[derive(Clone, Debug)]
pub struct Config {
    pub github_token: Option<String>,
    pub redis_url: Option<String>,
    pub openai_key: Option<String>,
    pub anthropic_key: Option<String>,
    pub watchlist_raw: Option<String>,
    pub brain: PathBuf,
    pub cells: PathBuf,
    pub port: u16,
    pub promote_allow: bool,
}

impl Config {
    pub fn from_env() -> Self {
        let _ = dotenvy::dotenv();
        let brain = std::env::var("EVOLVEMENT_BRAIN")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                std::env::var("EVOLVEMENT_ROOT")
                    .map(|root| brain_from_root(PathBuf::from(root)))
                    .unwrap_or_else(|_| default_brain())
            });
        let port = std::env::var("PORT")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(8787);
        Self {
            github_token: nonempty("GITHUB_TOKEN"),
            redis_url: nonempty("REDIS_URL"),
            openai_key: nonempty("OPENAI_API_KEY"),
            anthropic_key: nonempty("ANTHROPIC_API_KEY"),
            watchlist_raw: nonempty("WATCHLIST"),
            brain,
            cells: cells_root(),
            port,
            promote_allow: std::env::var("EVOLVEMENT_PROMOTE")
                .map(|v| v == "allow")
                .unwrap_or(false),
        }
    }
}

fn nonempty(key: &str) -> Option<String> {
    std::env::var(key).ok().filter(|s| !s.trim().is_empty())
}

pub fn cells_root() -> PathBuf {
    std::env::var("EVOLVEMENT_ROOT")
        .map(|root| PathBuf::from(root).join("cells"))
        .unwrap_or_else(|_| PathBuf::from("cells"))
}

pub fn brain_from_root(root: PathBuf) -> PathBuf {
    let nested = [
        root.join("memories"),
        root.join("aileena-new/aileena_second_brain/memories"),
        root.join("../aileena-new/aileena_second_brain/memories"),
    ];
    for mem in &nested {
        if mem.is_dir() {
            return mem.parent().unwrap().to_path_buf();
        }
    }
    default_brain()
}

pub fn default_brain() -> PathBuf {
    let candidates = [
        PathBuf::from("aileena-new/aileena_second_brain"),
        PathBuf::from("../aileena-new/aileena_second_brain"),
    ];
    for c in &candidates {
        if c.join("memories").is_dir() {
            return c.clone();
        }
    }
    candidates[0].clone()
}
