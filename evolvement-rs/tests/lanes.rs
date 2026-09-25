use evolvement_rs::sell::routes::{classify, Route};

#[test]
fn classify_table() {
    assert_eq!(classify("Didion shelf").as_str(), "taste");
    assert_eq!(classify("音乐").as_str(), "taste");
    assert_eq!(classify("更新了什么吗").as_str(), "latest_updates");
    assert_eq!(classify("hire").as_str(), "hire_cv");
    assert_eq!(classify("合作").as_str(), "hire_cv");
    assert_eq!(classify("我问过什么").as_str(), "soft_recall");
    assert_eq!(classify("你怎么进化").as_str(), "evolvement");
    assert_eq!(classify("github rust").as_str(), "repo");
}

#[test]
fn latest_is_not_hire() {
    assert!(matches!(classify("更新了什么吗"), Route::Latest));
}
