#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Route {
    Taste,
    Latest,
    Hire,
    SoftRecall,
    Evolvement,
    Repo,
    Forge,
    Cell,
    Night,
}

impl Route {
    pub fn as_str(self) -> &'static str {
        match self {
            Route::Taste => "taste",
            Route::Latest => "latest_updates",
            Route::Hire => "hire_cv",
            Route::SoftRecall => "soft_recall",
            Route::Evolvement => "evolvement",
            Route::Repo => "repo",
            Route::Forge => "forge",
            Route::Cell => "cell",
            Route::Night => "night",
        }
    }
}

pub fn classify(message: &str) -> Route {
    let m = message.to_lowercase();
    if is_hire(&m) {
        return Route::Hire;
    }
    if is_cell(&m) {
        return Route::Cell;
    }
    if is_night(&m) {
        return Route::Night;
    }
    if is_forge(&m) {
        return Route::Forge;
    }
    if is_latest(&m) {
        return Route::Latest;
    }
    if is_evolvement(&m) {
        return Route::Evolvement;
    }
    if is_soft(&m) {
        return Route::SoftRecall;
    }
    if is_repo(&m) {
        return Route::Repo;
    }
    Route::Taste
}

fn is_hire(m: &str) -> bool {
    m.contains("hire")
        || m.contains(" cv")
        || m.contains("résumé")
        || m.contains("resume")
        || m.contains("招")
        || m.contains("合作")
}

fn is_latest(m: &str) -> bool {
    m.contains("what's new")
        || m.contains("whats new")
        || m.contains("latest")
        || m.contains("更新")
}

fn is_evolvement(m: &str) -> bool {
    m.contains("evolvement")
        || m.contains("how do you learn")
        || m.contains("subscribe")
        || m.contains("你怎么进化")
        || m.contains("怎么进化")
        || m.contains("进化")
        || m.contains("dream")
        || m.contains("memory")
}

fn is_soft(m: &str) -> bool {
    m.contains("what did i ask")
        || m.contains("之前")
        || m.contains("asked before")
        || m.contains("我问过")
}

fn is_cell(m: &str) -> bool {
    m.starts_with("run ") || m.starts_with("$") || m.contains("开电脑")
}

fn is_night(m: &str) -> bool {
    m.contains("今晚") || m.contains("陪") || m.contains("night")
}

fn is_forge(m: &str) -> bool {
    m.contains("forge")
        || m.contains("pull request")
        || m.contains("open a pr")
        || m.contains("改代码")
        || (m.contains("github.com") && (m.contains(" pr") || m.contains("branch")))
}

fn is_repo(m: &str) -> bool {
    m.contains("repo")
        || m.contains("github")
        || m.contains("digest")
        || (m.contains("star") && !m.contains("start"))
}

pub fn is_chip_lane(message: &str) -> bool {
    let m = message.to_lowercase();
    m.contains("h100")
        || m.contains("hbm")
        || m.contains(".pdf")
        || m.contains("chip pricing")
        || m.contains("semi pdf")
}

pub fn topics_from(message: &str) -> Vec<String> {
    let m = message.to_lowercase();
    let mut topics = Vec::new();
    for (needle, topic) in [
        ("solana", "solana"),
        ("glass", "glass kiln"),
        ("hire", "hire"),
        ("techno", "techno"),
        ("hockney", "hockney"),
        ("rust", "rust"),
    ] {
        if m.contains(needle) {
            topics.push(topic.into());
        }
    }
    topics
}

pub fn lang_of(message: &str) -> &'static str {
    if message.chars().any(|c| ('\u{4e00}'..='\u{9fff}').contains(&c)) {
        "zh"
    } else if message.to_lowercase().contains("nicht") || message.contains("ß") {
        "de"
    } else {
        "en"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chinese_update_is_latest() {
        assert_eq!(classify("更新了什么吗"), Route::Latest);
    }

    #[test]
    fn hire_beats_taste() {
        assert_eq!(classify("is she available for hire? she likes techno"), Route::Hire);
    }
}
