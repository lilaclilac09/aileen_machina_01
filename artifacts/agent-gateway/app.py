"""Loopback AI gateway. Official API keys only. No accounts, cookies, or pools."""

from __future__ import annotations

import hmac
import json
import os
import re
import time
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response, StreamingResponse

HOST = "127.0.0.1"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
OPENAI_MODELS = ("gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o4-mini")
ANTHROPIC_MODELS = ("claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5")
MAX_BODY = 8 * 1024 * 1024

load_dotenv(Path(__file__).with_name(".env"))


def vendor_for(model: str) -> str:
    name = model.lower()
    if name.startswith("claude") or name.startswith("anthropic"):
        return "anthropic"
    return "openai"


def secret_eq(got: str, expected: str) -> bool:
    if not expected or len(got) != len(expected):
        return False
    return hmac.compare_digest(got.encode(), expected.encode())


def bearer(header: str | None) -> str:
    match = re.fullmatch(r"Bearer\s+(\S+)\s*", header or "", flags=re.IGNORECASE)
    return match.group(1) if match else ""


def mask_key(value: str) -> str:
    if not value:
        return "not set"
    if len(value) < 8:
        return "set"
    return f"{value[:3]}…{value[-4:]}"


def text_of(content) -> str:
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    parts = []
    for part in content:
        if isinstance(part, str):
            parts.append(part)
        elif isinstance(part, dict) and isinstance(part.get("text"), str):
            parts.append(part["text"])
    return "".join(parts)


def to_anthropic(body: dict) -> dict:
    system: list[str] = []
    chat: list[dict] = []
    for message in body.get("messages") or []:
        role = message.get("role") if isinstance(message, dict) else None
        content = message.get("content") if isinstance(message, dict) else None
        if role == "system":
            text = text_of(content)
            if text:
                system.append(text)
            continue
        if role not in ("user", "assistant"):
            raise ValueError(f"unsupported message role: {role or 'missing'}")
        text = text_of(content)
        if chat and chat[-1]["role"] == role:
            chat[-1]["content"] += f"\n{text}"
        else:
            chat.append({"role": role, "content": text})
    if not chat or chat[0]["role"] != "user":
        raise ValueError("anthropic messages must start with a user turn")
    out = {
        "model": body.get("model"),
        "max_tokens": body.get("max_tokens") or body.get("max_completion_tokens") or 1024,
        "messages": chat,
        "stream": bool(body.get("stream")),
    }
    if system:
        out["system"] = "\n\n".join(system)
    if body.get("temperature") is not None:
        out["temperature"] = body["temperature"]
    if body.get("top_p") is not None:
        out["top_p"] = body["top_p"]
    if body.get("stop") is not None:
        stop = body["stop"]
        out["stop_sequences"] = stop if isinstance(stop, list) else [stop]
    return out


def from_anthropic(payload: dict) -> dict:
    blocks = payload.get("content") or []
    text = "".join(
        block.get("text", "")
        for block in blocks
        if isinstance(block, dict) and block.get("type") == "text" and isinstance(block.get("text"), str)
    )
    usage = payload.get("usage") or {}
    prompt = int(usage.get("input_tokens") or 0)
    completion = int(usage.get("output_tokens") or 0)
    finish = "length" if payload.get("stop_reason") == "max_tokens" else "stop"
    return {
        "id": payload.get("id") or "chatcmpl-gateway",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": payload.get("model"),
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": text},
                "finish_reason": finish,
            }
        ],
        "usage": {
            "prompt_tokens": prompt,
            "completion_tokens": completion,
            "total_tokens": prompt + completion,
        },
    }


def usage_pair(payload: dict) -> tuple[int, int]:
    usage = payload.get("usage") if isinstance(payload, dict) else None
    if not isinstance(usage, dict):
        return 0, 0
    prompt = usage.get("prompt_tokens", usage.get("input_tokens"))
    completion = usage.get("completion_tokens", usage.get("output_tokens"))
    if prompt is None and completion is None and usage.get("total_tokens") is not None:
        return 0, int(usage["total_tokens"])
    return int(prompt or 0), int(completion or 0)


def usage_from_text(text: str) -> tuple[int, int]:
    try:
        return usage_pair(json.loads(text))
    except json.JSONDecodeError:
        pass
    prompts = [int(n) for n in re.findall(r'"prompt_tokens"\s*:\s*(\d+)', text)]
    completions = [int(n) for n in re.findall(r'"completion_tokens"\s*:\s*(\d+)', text)]
    if prompts or completions:
        return prompts[-1] if prompts else 0, completions[-1] if completions else 0
    totals = [int(n) for n in re.findall(r'"total_tokens"\s*:\s*(\d+)', text)]
    if totals:
        return 0, totals[-1]
    return 0, 0


class SseState:
    def __init__(self, model: str):
        self.buf = ""
        self.id = "chatcmpl-gateway"
        self.model = model
        self.prompt = 0
        self.completion = 0

    def feed(self, chunk: str) -> str:
        self.buf += chunk
        lines = self.buf.split("\n")
        self.buf = lines.pop() if lines else ""
        out = []
        for line in lines:
            if not line.startswith("data:"):
                continue
            raw = line[5:].strip()
            if not raw or raw == "[DONE]":
                continue
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                continue
            kind = event.get("type")
            if kind == "message_start":
                message = event.get("message") or {}
                self.id = message.get("id") or self.id
                self.model = message.get("model") or self.model
                self.prompt = int((message.get("usage") or {}).get("input_tokens") or self.prompt)
                out.append(self._chunk({"role": "assistant", "content": ""}, None, None))
            elif kind == "content_block_delta" and (event.get("delta") or {}).get("type") == "text_delta":
                out.append(self._chunk({"content": (event.get("delta") or {}).get("text") or ""}, None, None))
            elif kind == "message_delta":
                self.completion = int((event.get("usage") or {}).get("output_tokens") or self.completion)
                finish = "length" if (event.get("delta") or {}).get("stop_reason") == "max_tokens" else "stop"
                usage = {
                    "prompt_tokens": self.prompt,
                    "completion_tokens": self.completion,
                    "total_tokens": self.prompt + self.completion,
                }
                out.append(self._chunk({}, finish, usage))
            elif kind == "message_stop":
                out.append("data: [DONE]\n\n")
        return "".join(out)

    def _chunk(self, delta: dict, finish, usage) -> str:
        payload = {
            "id": self.id,
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": self.model,
            "choices": [{"index": 0, "delta": delta, "finish_reason": finish}],
        }
        if usage is not None:
            payload["usage"] = usage
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def error(status: int, message: str, kind: str = "invalid_request_error", code: str | None = None) -> JSONResponse:
    body = {"message": message, "type": kind}
    if code:
        body["code"] = code
    return JSONResponse({"error": body}, status_code=status)


def create_app(env: dict | None = None, client: httpx.AsyncClient | None = None) -> FastAPI:
    env = env if env is not None else os.environ
    gateway_key = env.get("GATEWAY_API_KEY") or ""
    if not gateway_key:
        raise RuntimeError("GATEWAY_API_KEY is empty")
    openai_key = env.get("OPENAI_API_KEY") or ""
    anthropic_key = env.get("ANTHROPIC_API_KEY") or ""
    dashboard_token = env.get("DASHBOARD_TOKEN") or ""
    http = client or httpx.AsyncClient(timeout=httpx.Timeout(connect=15.0, read=None, write=30.0, pool=15.0))

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        yield
        if client is None:
            await http.aclose()

    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
    app.state.started = time.monotonic()
    app.state.requests = 0
    app.state.success = 0
    app.state.failure = 0
    app.state.tokens_in = 0
    app.state.tokens_out = 0
    app.state.recent = deque(maxlen=80)
    app.state.http = http

    def record(model: str, vendor: str, status: int, started: float, tokens_in: int, tokens_out: int) -> None:
        ms = int((time.perf_counter() - started) * 1000)
        app.state.requests += 1
        if 200 <= status < 300:
            app.state.success += 1
        else:
            app.state.failure += 1
        app.state.tokens_in += tokens_in
        app.state.tokens_out += tokens_out
        shown = f"{tokens_in}/{tokens_out}" if tokens_in or tokens_out else "-"
        app.state.recent.appendleft(
            {
                "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "model": model or "-",
                "vendor": vendor,
                "ms": ms,
                "tokens": shown,
                "status": status,
            }
        )
        print(f"{app.state.recent[0]['time']} {model or '-'} {vendor} {shown} {ms}ms {status}", flush=True)

    def authorized(request: Request) -> bool:
        return secret_eq(bearer(request.headers.get("authorization")), gateway_key)

    def dashboard_ok(request: Request) -> bool:
        if not dashboard_token:
            return True
        got = request.headers.get("x-dashboard-token") or ""
        if not got:
            got = bearer(request.headers.get("authorization"))
        if not got:
            got = request.query_params.get("token") or ""
        return secret_eq(got, dashboard_token)

    @app.get("/health")
    async def health(request: Request):
        if not authorized(request):
            return error(401, "invalid gateway bearer", "auth_error", "gateway_unauthorized")
        return {
            "ok": True,
            "openai": bool(openai_key),
            "anthropic": bool(anthropic_key),
        }

    @app.get("/v1/models")
    async def models(request: Request):
        if not authorized(request):
            return error(401, "invalid gateway bearer", "auth_error", "gateway_unauthorized")
        data = []
        if openai_key:
            data.extend({"id": model_id, "object": "model", "owned_by": "openai"} for model_id in OPENAI_MODELS)
        if anthropic_key:
            data.extend(
                {"id": model_id, "object": "model", "owned_by": "anthropic"} for model_id in ANTHROPIC_MODELS
            )
        return {"object": "list", "data": data}

    @app.get("/", response_class=HTMLResponse)
    async def dashboard(request: Request):
        if not dashboard_ok(request):
            return HTMLResponse("dashboard token required", status_code=401)
        return HTMLResponse(DASHBOARD_HTML)

    @app.get("/api/stats")
    async def stats(request: Request):
        if not dashboard_ok(request):
            return error(401, "dashboard token required", "auth_error", "dashboard_unauthorized")
        return {
            "requests": app.state.requests,
            "success": app.state.success,
            "failure": app.state.failure,
            "tokens_in": app.state.tokens_in,
            "tokens_out": app.state.tokens_out,
            "uptime_s": int(time.monotonic() - app.state.started),
            "keys": {"openai": mask_key(openai_key), "anthropic": mask_key(anthropic_key)},
            "recent": list(app.state.recent),
        }

    @app.post("/v1/chat/completions")
    async def chat(request: Request):
        if not authorized(request):
            return error(401, "invalid gateway bearer", "auth_error", "gateway_unauthorized")
        raw = await request.body()
        if len(raw) > MAX_BODY:
            return error(413, "body too large")
        try:
            body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return error(400, "invalid json")
        if not isinstance(body, dict):
            return error(400, "invalid json")
        model = body.get("model") if isinstance(body.get("model"), str) else ""
        vendor = vendor_for(model)
        key = openai_key if vendor == "openai" else anthropic_key
        if not key:
            which = "OPENAI_API_KEY" if vendor == "openai" else "ANTHROPIC_API_KEY"
            record(model, vendor, 401, time.perf_counter(), 0, 0)
            return error(401, f"{which} is empty", "auth_error", "missing_api_key")
        started = time.perf_counter()
        if vendor == "openai":
            return await relay_openai(raw, model, key, started)
        try:
            upstream_body = to_anthropic(body)
        except ValueError as exc:
            record(model, vendor, 400, started, 0, 0)
            return error(400, str(exc))
        return await relay_anthropic(upstream_body, model, key, started, bool(body.get("stream")))

    async def relay_openai(raw: bytes, model: str, key: str, started: float):
        cm = app.state.http.stream(
            "POST",
            OPENAI_URL,
            headers={"authorization": f"Bearer {key}", "content-type": "application/json"},
            content=raw,
        )
        try:
            resp = await cm.__aenter__()
        except httpx.HTTPError as exc:
            record(model, "openai", 502, started, 0, 0)
            return error(502, str(exc), "api_error")
        media = resp.headers.get("content-type", "application/json")
        if resp.status_code >= 400 or "text/event-stream" not in media:
            raw_body = await resp.aread()
            await cm.__aexit__(None, None, None)
            tin, tout = usage_from_text(raw_body.decode("utf-8", "replace"))
            record(model, "openai", resp.status_code, started, tin, tout)
            return Response(content=raw_body, status_code=resp.status_code, media_type=media)

        async def gen():
            seen = bytearray()
            try:
                async for chunk in resp.aiter_bytes():
                    if len(seen) < 200_000:
                        seen.extend(chunk)
                    yield chunk
            finally:
                tin, tout = usage_from_text(seen.decode("utf-8", "replace"))
                record(model, "openai", resp.status_code, started, tin, tout)
                await cm.__aexit__(None, None, None)

        return StreamingResponse(gen(), status_code=resp.status_code, media_type=media, headers={"cache-control": "no-cache"})

    async def relay_anthropic(payload: dict, model: str, key: str, started: float, stream: bool):
        cm = app.state.http.stream(
            "POST",
            ANTHROPIC_URL,
            headers={
                "x-api-key": key,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            json=payload,
        )
        try:
            resp = await cm.__aenter__()
        except httpx.HTTPError as exc:
            record(model, "anthropic", 502, started, 0, 0)
            return error(502, str(exc), "api_error")
        if resp.status_code >= 400:
            raw_body = await resp.aread()
            media = resp.headers.get("content-type", "application/json")
            await cm.__aexit__(None, None, None)
            record(model, "anthropic", resp.status_code, started, 0, 0)
            return Response(content=raw_body, status_code=resp.status_code, media_type=media)
        if not stream:
            raw_body = await resp.aread()
            await cm.__aexit__(None, None, None)
            try:
                shaped = from_anthropic(json.loads(raw_body))
            except json.JSONDecodeError:
                record(model, "anthropic", 502, started, 0, 0)
                return error(502, "invalid upstream json", "api_error")
            tin, tout = usage_pair(shaped)
            record(model, "anthropic", 200, started, tin, tout)
            return JSONResponse(shaped)
        state = SseState(model)

        async def gen():
            try:
                async for chunk in resp.aiter_text():
                    converted = state.feed(chunk)
                    if converted:
                        yield converted.encode()
                if state.buf.strip():
                    tail = state.feed("\n")
                    if tail:
                        yield tail.encode()
            finally:
                total = state.prompt + state.completion
                record(
                    model,
                    "anthropic",
                    200,
                    started,
                    state.prompt,
                    state.completion if total else 0,
                )
                await cm.__aexit__(None, None, None)

        return StreamingResponse(
            gen(),
            status_code=200,
            media_type="text/event-stream; charset=utf-8",
            headers={"cache-control": "no-cache"},
        )

    return app


DASHBOARD_HTML = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>agent gateway</title>
<style>
body{margin:0;background:#f6f1e8;color:#1c1915;font:15px/1.45 ui-sans-serif,system-ui,sans-serif}
main{max-width:860px;margin:40px auto;padding:0 20px}
h1{font-weight:450;font-size:1.3rem;margin:0 0 6px}
p{color:#5c6764;margin:0 0 16px}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}
.card{background:#fffdf8;border:1px solid #e4ddd0;border-radius:10px;padding:10px 12px}
.card b{display:block;font-weight:500;font-size:1.05rem}
.card span{color:#5c6764;font-size:.75rem}
table{width:100%;border-collapse:collapse;font-size:.82rem;font-variant-numeric:tabular-nums}
th{text-align:left;font-weight:500;color:#3d6f6a}
td,th{padding:7px 6px 7px 0;border-bottom:1px solid #e4ddd0}
.pill{display:inline-block;margin-right:8px;padding:2px 8px;border-radius:999px;background:#d8eeeb}
</style></head><body><main>
<h1>agent gateway</h1>
<p>127.0.0.1 · official keys only · claude* / anthropic* → anthropic · else → openai</p>
<p id="keys"></p>
<div class="grid">
<div class="card"><b id="n">0</b><span>requests</span></div>
<div class="card"><b id="ok">0</b><span>success</span></div>
<div class="card"><b id="bad">0</b><span>failure</span></div>
<div class="card"><b id="tok">0 / 0</b><span>tokens in / out</span></div>
<div class="card"><b id="up">0s</b><span>uptime</span></div>
</div>
<table><thead><tr><th>time</th><th>model</th><th>vendor</th><th>ms</th><th>tokens</th><th>status</th></tr></thead>
<tbody id="rows"></tbody></table>
<script>
const token = new URLSearchParams(location.search).get("token") || "";
const headers = token ? {"X-Dashboard-Token": token} : {};
function esc(s){return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
async function tick(){
  const res = await fetch("/api/stats", {headers});
  if(!res.ok){ document.getElementById("keys").textContent = "dashboard token required"; return; }
  const data = await res.json();
  document.getElementById("n").textContent = data.requests;
  document.getElementById("ok").textContent = data.success;
  document.getElementById("bad").textContent = data.failure;
  document.getElementById("tok").textContent = data.tokens_in + " / " + data.tokens_out;
  document.getElementById("up").textContent = data.uptime_s + "s";
  document.getElementById("keys").innerHTML =
    '<span class="pill">openai ' + esc(data.keys.openai) + '</span><span class="pill">anthropic ' + esc(data.keys.anthropic) + '</span>';
  document.getElementById("rows").innerHTML = data.recent.map(row =>
    '<tr><td>'+esc(row.time)+'</td><td>'+esc(row.model)+'</td><td>'+esc(row.vendor)+'</td><td>'+esc(row.ms)+'</td><td>'+esc(row.tokens)+'</td><td>'+esc(row.status)+'</td></tr>'
  ).join("");
}
tick();
setInterval(tick, 2000);
</script>
</main></body></html>
"""


def main() -> None:
    host = os.environ.get("GATEWAY_HOST", HOST)
    if host != HOST:
        raise SystemExit(f"refusing to bind {host}; this gateway listens on 127.0.0.1 only")
    port = int(os.environ.get("GATEWAY_PORT") or "8787")
    app = create_app()
    import uvicorn

    uvicorn.run(app, host=HOST, port=port, log_level="info")


if __name__ == "__main__":
    main()
