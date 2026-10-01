use std::net::SocketAddr;
use std::path::PathBuf;

use clap::{Parser, Subcommand};
use evolvement_rs::{router, run_dream, run_harvest, run_promote, state_from_config, Config};

#[derive(Parser)]
#[command(name = "evolvement")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    Serve,
    Dream,
    Harvest {
        #[arg(long)]
        star: bool,
    },
    Promote {
        file: PathBuf,
        dest: PathBuf,
    },
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();
    let cfg = Config::from_env();
    match cli.cmd {
        Cmd::Serve => {
            let app = router(state_from_config(&cfg));
            let addr = SocketAddr::from(([0, 0, 0, 0], cfg.port));
            println!("evolvement listening on http://{addr}");
            let listener = tokio::net::TcpListener::bind(addr).await.expect("bind");
            axum::serve(listener, app).await.expect("serve");
        }
        Cmd::Dream => {
            let path = run_dream(&cfg.brain).expect("dream");
            println!("{}", path.display());
        }
        Cmd::Harvest { star } => {
            let path = run_harvest(&cfg, star).await.expect("harvest");
            println!("{}", path.display());
        }
        Cmd::Promote { file, dest } => {
            let name = dest.file_name().and_then(|n| n.to_str()).unwrap_or("weekly-note.md");
            let path = run_promote(&cfg, &file, name).expect("promote");
            println!("{}", path.display());
        }
    }
}
