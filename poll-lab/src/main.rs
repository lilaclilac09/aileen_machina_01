use poll_lab::{poll_until_open, PollConfig};
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cfg = PollConfig {
        url: "http://127.0.0.1:18080/status".into(),
        interval: Duration::from_secs(2),
        max_attempts: 5,
    };
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()?;

    match poll_until_open(&client, &cfg).await {
        Ok(s) => println!("open={}, earliest={:?}", s.open, s.earliest),
        Err(e) => eprintln!("stop: {e}"),
    }
    Ok(())
}
