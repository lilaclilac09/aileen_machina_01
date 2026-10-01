# Intent Aggregator

Text in. Structured intent out. Jev judges. This crate decides the next step.

The page at `/` is an English demo. It does not call Jev. The badge says so.
`POST /api/analyze` is the real backend. `POST /api/transcribe` is the audio step in front of it.

## Run locally

```bash
cd intent-aggregator
cargo build
export TYPESAFE_API_KEY=your-key   # server only; never commit it
cargo run
```

Open `http://127.0.0.1:8788/`.

```bash
curl -s http://127.0.0.1:8788/api/analyze \
  -H 'content-type: application/json' \
  -d '{"scenario":"customer","text":"我要退款"}'
```

Optional port: `PORT=8790 cargo run`.

Jev state is `{"scenario","text"}` plus, for a meeting only, `emotion_timeline` and `emotion_legend`.
Choice and score answers with `confidence < 0.5` force `review_manually` and list those question ids in `low_confidence`.
`needs_human` / `wants_revision` / `is_urgent` above `0.7` map to `escalate_human`, `prepare_revision`, and `handle_immediately`.
Other actions are documented on `map_scenario` in `src/decide.rs`. All thresholds are constants in that file.

Retries: HTTP 429 and 529, three attempts, exponential backoff, then 502.
The key is read from `TYPESAFE_API_KEY` and is not logged or returned.

## Audio

`POST /api/transcribe` accepts one multipart file: mp3, wav, or m4a, up to 100MB.
The handler shells out to the `whisper` CLI and deletes the temp file.

Tradeoff: `whisper-rs` compiles whisper.cpp, which needs cmake and a C++ toolchain, and it pulls a model into the build. The CLI keeps `cargo build` small. You install the binary and the model yourself.

```bash
pip install openai-whisper
# ffmpeg is required by whisper
# the base model downloads on first use into the whisper cache
```

`WHISPER_MODEL` overrides the model name (default `base`).

The demo page's 上传音频 button calls this endpoint and fills the textarea. 分析意图 still uses the mock.

## Meeting video (optional)

`emotion/sample_emotions.py` reads a video file you already have, takes one frame every 10 seconds, and writes `emotion_timeline.json`. It tries DeepFace, then FER.

```bash
pip install opencv-python deepface
python emotion/sample_emotions.py meeting.mp4 emotion_timeline.json
```

Pass that JSON as `emotion_timeline` on `POST /api/analyze` when `scenario` is `meeting`. Other scenarios ignore it.

This signal is noisy. Facial expressions are not the same thing as emotions; the psychology is unsettled. Jev's output is a probabilistic reference only. Do not analyze a recording unless every participant consented.

## Purchase review

A customer answer of `purchase` with confidence above `0.8` can trigger a second Jev call in `src/risk.rs`. That call only asks noul questions. Limits (`budget`, `preauthorized`, `item`, `amount`, `currency`) must be passed in the request. They are never hardcoded.

All risk nouls below `0.3` returns `suggested_action: "ready_to_pay"` and a `payment_intent` object `{ item, amount, currency, confidence, risk_answers }`. Anything else is `review_manually`.

This crate does not move money. The x402 / Mercator payment step is outside this repo. There is no payment client here.
