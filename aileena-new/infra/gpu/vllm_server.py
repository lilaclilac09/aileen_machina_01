"""
Aileena GPU tier: vLLM serving an open 8B model behind an OpenAI-compatible API on Modal.

Deploy (from aileena-new/):
    modal secret create aileena-gpu-key VLLM_API_KEY=<long random string>
    modal deploy infra/gpu/vllm_server.py

Smoke test (spins up one replica, health-checks it, sends one chat turn):
    modal run infra/gpu/vllm_server.py

Nothing here runs unless you deploy it. The Next.js app keeps the GPU tier OFF
until AGENT_GPU_MODE / AGENT_GPU_BASE_URL / AGENT_GPU_API_KEY are set in Vercel.

Deploy-time knobs (read from YOUR shell when you run `modal deploy`, then baked
into the image env so the container sees the same values):

    AILEENA_GPU_MODEL          HF repo id            (default Qwen/Qwen3-8B)
    AILEENA_GPU_REVISION       HF revision / commit  (default main; pin a commit for prod)
    AILEENA_GPU_SERVED_NAME    model name in the API (default open-8b; never contains "qwen")
    AILEENA_GPU_TYPE           Modal GPU type        (default L40S; A10 / L4 work with AWQ)
    AILEENA_GPU_QUANT          "" | fp8 | awq        (default ""; fp8 needs Ada/Hopper: L40S, L4, H100)
    AILEENA_GPU_SPEC           "" | ngram | draft    (default ""; speculative decoding)
    AILEENA_GPU_MAX_LEN        max context tokens    (default 32768)
    AILEENA_GPU_MAX_SEQS       max concurrent seqs   (default 32)
    AILEENA_GPU_SCALEDOWN_S    idle seconds before scale-to-zero (default 300)
    AILEENA_GPU_FAST_BOOT      1 = --enforce-eager (faster cold start, slower decode; default 1)
    AILEENA_GPU_REGION         Modal routing region  (default us-east; Vercel functions run in iad1)
    AILEENA_GPU_KEEP_WARM_UTC  e.g. "1-15" keeps one replica warm in those UTC hours (default off)
"""

import json
import os

import modal

MINUTES = 60
VLLM_PORT = 8000


def _env(name: str, default: str) -> str:
    value = os.environ.get(name, "").strip()
    return value or default


CONFIG = {
    "AILEENA_GPU_MODEL": _env("AILEENA_GPU_MODEL", "Qwen/Qwen3-8B"),
    "AILEENA_GPU_REVISION": _env("AILEENA_GPU_REVISION", "main"),
    "AILEENA_GPU_SERVED_NAME": _env("AILEENA_GPU_SERVED_NAME", "open-8b"),
    "AILEENA_GPU_QUANT": _env("AILEENA_GPU_QUANT", ""),
    "AILEENA_GPU_SPEC": _env("AILEENA_GPU_SPEC", ""),
    "AILEENA_GPU_MAX_LEN": _env("AILEENA_GPU_MAX_LEN", "32768"),
    "AILEENA_GPU_MAX_SEQS": _env("AILEENA_GPU_MAX_SEQS", "32"),
    "AILEENA_GPU_FAST_BOOT": _env("AILEENA_GPU_FAST_BOOT", "1"),
}
GPU_TYPE = _env("AILEENA_GPU_TYPE", "L40S")
SCALEDOWN_S = int(_env("AILEENA_GPU_SCALEDOWN_S", "300"))
ROUTING_REGION = _env("AILEENA_GPU_REGION", "us-east")
KEEP_WARM_UTC = _env("AILEENA_GPU_KEEP_WARM_UTC", "")

if "qwen" in CONFIG["AILEENA_GPU_SERVED_NAME"].lower():
    # The site classifies any provider containing "qwen" as the on-device model.
    raise SystemExit("AILEENA_GPU_SERVED_NAME must not contain 'qwen' (use e.g. open-8b).")
if CONFIG["AILEENA_GPU_QUANT"] not in ("", "fp8", "awq"):
    raise SystemExit("AILEENA_GPU_QUANT must be '', 'fp8' or 'awq'.")
if CONFIG["AILEENA_GPU_SPEC"] not in ("", "ngram", "draft"):
    raise SystemExit("AILEENA_GPU_SPEC must be '', 'ngram' or 'draft'.")

vllm_image = (
    modal.Image.from_registry("nvidia/cuda:12.9.0-devel-ubuntu22.04", add_python="3.12")
    .entrypoint([])
    .uv_pip_install("vllm==0.21.0")
    .env({"HF_XET_HIGH_PERFORMANCE": "1", "VLLM_LOG_STATS_INTERVAL": "10", **CONFIG})
)

hf_cache_vol = modal.Volume.from_name("aileena-hf-cache", create_if_missing=True)
vllm_cache_vol = modal.Volume.from_name("aileena-vllm-cache", create_if_missing=True)

app = modal.App("aileena-gpu")


def variant_tag(cfg: dict) -> str:
    """e.g. base, fp8, awq-ngram, base-draft-eager. Shown in the dashboard's Compare view."""
    parts = [cfg["AILEENA_GPU_QUANT"] or "base"]
    if cfg["AILEENA_GPU_SPEC"]:
        parts.append(cfg["AILEENA_GPU_SPEC"])
    if cfg["AILEENA_GPU_FAST_BOOT"] == "1":
        parts.append("eager")
    return "-".join(parts)


def build_vllm_command(cfg: dict, api_key: str) -> list:
    """The exact `vllm serve` argv. Kept pure so it can be checked without a GPU."""
    if not api_key:
        raise RuntimeError("VLLM_API_KEY is empty: refusing to serve without auth.")
    model = cfg["AILEENA_GPU_MODEL"]
    quant = cfg["AILEENA_GPU_QUANT"]
    if quant == "awq" and not model.lower().endswith("-awq"):
        model = f"{model}-AWQ"  # Qwen publishes Qwen/Qwen3-8B-AWQ
    cmd = [
        "vllm", "serve", model,
        "--revision", cfg["AILEENA_GPU_REVISION"],
        # Second alias `<name>.<variant>` lets the site's performance dashboard
        # tag GPU turns by optimisation (read from /v1/models).
        "--served-model-name", cfg["AILEENA_GPU_SERVED_NAME"], f'{cfg["AILEENA_GPU_SERVED_NAME"]}.{variant_tag(cfg)}',
        "--host", "0.0.0.0",
        "--port", str(VLLM_PORT),
        "--api-key", api_key,
        "--max-model-len", cfg["AILEENA_GPU_MAX_LEN"],
        "--max-num-seqs", cfg["AILEENA_GPU_MAX_SEQS"],
        "--gpu-memory-utilization", "0.92",
        # The site keeps a byte-stable system prefix per root, so prefix caching
        # turns every follow-up turn into a mostly-cached prefill.
        "--enable-prefix-caching",
        "--enable-chunked-prefill",
        # Report usage.prompt_tokens_details.cached_tokens (read by modelRouter).
        "--enable-prompt-tokens-details",
        # Tool calling for the site's 15 tools (Qwen3 uses the hermes format).
        "--enable-auto-tool-choice",
        "--tool-call-parser", "hermes",
        # Any stray <think> goes to the reasoning field, never into the answer.
        "--reasoning-parser", "qwen3",
        "--uvicorn-log-level", "warning",
    ]
    if quant == "fp8":
        cmd += ["--quantization", "fp8"]
    spec = cfg["AILEENA_GPU_SPEC"]
    if spec == "ngram":
        cmd += ["--speculative-config", json.dumps({"method": "ngram", "num_speculative_tokens": 4, "prompt_lookup_max": 4})]
    elif spec == "draft":
        cmd += ["--speculative-config", json.dumps({"model": "Qwen/Qwen3-0.6B", "num_speculative_tokens": 4})]
    cmd += ["--enforce-eager"] if cfg["AILEENA_GPU_FAST_BOOT"] == "1" else ["--no-enforce-eager"]
    return cmd


@app.server(
    image=vllm_image,
    gpu=GPU_TYPE,
    secrets=[modal.Secret.from_name("aileena-gpu-key")],
    scaledown_window=SCALEDOWN_S,
    startup_timeout=10 * MINUTES,
    volumes={"/root/.cache/huggingface": hf_cache_vol, "/root/.cache/vllm": vllm_cache_vol},
    port=VLLM_PORT,
    routing_region=ROUTING_REGION,
    target_concurrency=24,
    min_containers=0,  # scale to zero: you pay only while a replica is up
    max_containers=2,  # hard cost cap
    # Modal's proxy auth is off so the site can call it with a plain Bearer token;
    # vLLM itself enforces VLLM_API_KEY on every /v1 route (build_vllm_command
    # refuses to start without it). /health stays open so wakes need no key.
    unauthenticated=True,
)
class Server:
    @modal.enter()
    def start(self):
        import subprocess

        cfg = {k: os.environ[k] for k in CONFIG}
        cmd = build_vllm_command(cfg, os.environ.get("VLLM_API_KEY", ""))
        print(*[("***" if i > 0 and cmd[i - 1] == "--api-key" else a) for i, a in enumerate(cmd)])
        self.process = subprocess.Popen(cmd)

    @modal.exit()
    def stop(self):
        self.process.terminate()


if KEEP_WARM_UTC:
    start_h, end_h = (int(x) for x in KEEP_WARM_UTC.split("-", 1))

    @app.function(schedule=modal.Cron("*/15 * * * *"), timeout=60)
    def keep_warm():
        """Optional: hold one warm replica during busy UTC hours, zero otherwise."""
        import datetime

        hour = datetime.datetime.now(datetime.timezone.utc).hour
        warm = start_h <= hour < end_h if start_h <= end_h else (hour >= start_h or hour < end_h)
        modal.Server.from_name("aileena-gpu", "Server").update_autoscaler(min_containers=1 if warm else 0)
        print(f"keep_warm hour={hour} min_containers={1 if warm else 0}")


@app.local_entrypoint()
def smoke(timeout_s: int = 10 * MINUTES):
    """`modal run infra/gpu/vllm_server.py` – wake, wait for /health, send one turn."""
    import time
    import urllib.error
    import urllib.request

    url = Server.get_url()
    print(f"server: {url}")
    deadline = time.time() + timeout_s
    t0 = time.time()
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{url}/health", timeout=30) as r:
                if r.status == 200:
                    break
        except urllib.error.HTTPError as e:
            if e.code != 503:
                raise
        except urllib.error.URLError:
            pass
        time.sleep(2)
    else:
        raise SystemExit("health check timed out")
    print(f"healthy after {time.time() - t0:.0f}s")
    key = os.environ.get("VLLM_API_KEY") or input("VLLM_API_KEY (same value as the Modal secret): ").strip()
    body = json.dumps({
        "model": CONFIG["AILEENA_GPU_SERVED_NAME"],
        "messages": [{"role": "user", "content": "Say hello in five words."}],
        "max_tokens": 32,
        "chat_template_kwargs": {"enable_thinking": False},
    }).encode()
    req = urllib.request.Request(f"{url}/v1/chat/completions", data=body, headers={"content-type": "application/json", "authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        print(json.loads(r.read())["choices"][0]["message"]["content"])
