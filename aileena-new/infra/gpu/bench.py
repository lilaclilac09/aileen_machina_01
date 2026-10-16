"""
TTFT / decode-speed bench for the GPU tier (or any OpenAI-compatible endpoint).

Prompts are shaped like the site: one long byte-stable system prefix (so prefix
caching kicks in after the first request) plus a short, varying user turn.

    AGENT_GPU_BASE_URL=https://<workspace>--aileena-gpu-server.us-east.modal.direct/v1 \
    AGENT_GPU_API_KEY=... python infra/gpu/bench.py --n 12 --concurrency 4

Stdlib only. Each request costs GPU seconds, so keep --n small.
"""

import argparse
import concurrent.futures as cf
import json
import os
import statistics
import time
import urllib.request

SYSTEM = (
    "You are the console on Aileen's site. Answer briefly and cite her own writing. "
    + "Reference table: " + " ".join(f"tool_{i}: looks up section {i} of her notes." for i in range(400))
)
QUESTIONS = [
    "What does she work on?",
    "Summarize her PCB article in two lines.",
    "Is she open to hiring conversations?",
    "What music does she like?",
    "What is DeepSeek Harness?",
    "Give me one link to start with.",
]


def one(base: str, key: str, model: str, q: str) -> dict:
    body = json.dumps({
        "model": model,
        "stream": True,
        "stream_options": {"include_usage": True},
        "max_tokens": 160,
        "chat_template_kwargs": {"enable_thinking": False},
        "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": q}],
    }).encode()
    req = urllib.request.Request(f"{base}/chat/completions", data=body, headers={"content-type": "application/json", "authorization": f"Bearer {key}"})
    t0 = time.perf_counter()
    ttft = None
    out = 0
    cached = None
    with urllib.request.urlopen(req, timeout=120) as r:
        for raw in r:
            line = raw.decode().strip()
            if not line.startswith("data: ") or line == "data: [DONE]":
                continue
            chunk = json.loads(line[6:])
            if chunk.get("usage"):
                out = chunk["usage"].get("completion_tokens", out)
                cached = (chunk["usage"].get("prompt_tokens_details") or {}).get("cached_tokens")
            for c in chunk.get("choices", []):
                if c.get("delta", {}).get("content") and ttft is None:
                    ttft = time.perf_counter() - t0
    total = time.perf_counter() - t0
    decode = (out / (total - ttft)) if ttft and total > ttft and out else 0.0
    return {"ttft": ttft or total, "total": total, "out": out, "tok_s": decode, "cached": cached}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=12)
    ap.add_argument("--concurrency", type=int, default=4)
    ap.add_argument("--model", default=os.environ.get("AGENT_GPU_MODEL", "open-8b"))
    a = ap.parse_args()
    base = os.environ["AGENT_GPU_BASE_URL"].rstrip("/")
    key = os.environ["AGENT_GPU_API_KEY"]
    one(base, key, a.model, "warm-up")  # fills the prefix cache; fails fast on a cold 503
    with cf.ThreadPoolExecutor(a.concurrency) as ex:
        rows = list(ex.map(lambda i: one(base, key, a.model, QUESTIONS[i % len(QUESTIONS)]), range(a.n)))
    ttfts = sorted(r["ttft"] for r in rows)
    p = lambda q: ttfts[min(len(ttfts) - 1, int(q * len(ttfts)))]
    print(f"n={a.n} concurrency={a.concurrency}")
    print(f"TTFT p50={p(0.5) * 1000:.0f}ms p95={p(0.95) * 1000:.0f}ms")
    print(f"decode tok/s mean={statistics.mean(r['tok_s'] for r in rows):.1f}")
    print(f"cached prompt tokens (last): {rows[-1]['cached']}")


if __name__ == "__main__":
    main()
