import json
import unittest

import httpx

from app import create_app, mask_key, vendor_for


def events():
    rows = [
        {"type": "message_start", "message": {"id": "msg_1", "model": "claude-sonnet-4-5", "usage": {"input_tokens": 3}}},
        {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "pong"}},
        {"type": "message_delta", "delta": {"stop_reason": "end_turn"}, "usage": {"output_tokens": 1}},
        {"type": "message_stop"},
    ]
    return "".join(f"data: {json.dumps(row)}\n\n" for row in rows)


def handler(request: httpx.Request) -> httpx.Response:
    if request.url.host == "api.openai.com":
        assert request.headers["authorization"] == "Bearer sk-openai"
        return httpx.Response(
            429,
            json={"error": {"message": "insufficient_quota", "type": "insufficient_quota"}},
        )
    if request.url.host == "api.anthropic.com":
        assert request.headers["x-api-key"] == "sk-ant-test"
        body = json.loads(request.content)
        if body.get("stream"):
            return httpx.Response(200, text=events(), headers={"content-type": "text/event-stream"})
        return httpx.Response(
            200,
            json={
                "id": "msg_2",
                "model": "claude-sonnet-4-5",
                "stop_reason": "end_turn",
                "content": [{"type": "text", "text": "pong"}],
                "usage": {"input_tokens": 3, "output_tokens": 1},
            },
        )
    raise AssertionError(request.url)


class GatewayTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        self.app = create_app(
            {
                "GATEWAY_API_KEY": "gate-test",
                "OPENAI_API_KEY": "sk-openai",
                "ANTHROPIC_API_KEY": "sk-ant-test",
                "DASHBOARD_TOKEN": "",
            },
            self.client,
        )
        self.http = httpx.AsyncClient(transport=httpx.ASGITransport(app=self.app), base_url="http://127.0.0.1")

    async def asyncTearDown(self):
        await self.http.aclose()
        await self.client.aclose()

    async def test_routes_auth_passthrough_and_sse(self):
        self.assertEqual(vendor_for("claude-sonnet-4-5"), "anthropic")
        self.assertEqual(vendor_for("anthropic.claude"), "anthropic")
        self.assertEqual(vendor_for("gpt-4o-mini"), "openai")
        self.assertEqual(mask_key("sk-openai"), "sk-…enai")
        self.assertNotIn("sk-openai", mask_key("sk-openai")[4:])

        no_auth = await self.http.get("/v1/models")
        self.assertEqual(no_auth.status_code, 401)

        health = await self.http.get("/health", headers={"authorization": "Bearer gate-test"})
        self.assertEqual(health.json()["openai"], True)

        models = await self.http.get("/v1/models", headers={"authorization": "Bearer gate-test"})
        ids = [row["id"] for row in models.json()["data"]]
        self.assertIn("gpt-4o-mini", ids)
        self.assertIn("claude-sonnet-4-5", ids)

        quota = await self.http.post(
            "/v1/chat/completions",
            headers={"authorization": "Bearer gate-test"},
            json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "ping"}]},
        )
        self.assertEqual(quota.status_code, 429)
        self.assertEqual(quota.json()["error"]["message"], "insufficient_quota")

        sse = await self.http.post(
            "/v1/chat/completions",
            headers={"authorization": "Bearer gate-test"},
            json={"model": "claude-sonnet-4-5", "stream": True, "messages": [{"role": "user", "content": "ping"}]},
        )
        self.assertEqual(sse.status_code, 200)
        self.assertIn("pong", sse.text)
        self.assertIn("[DONE]", sse.text)

        plain = await self.http.post(
            "/v1/chat/completions",
            headers={"authorization": "Bearer gate-test"},
            json={"model": "anthropic.claude", "messages": [{"role": "user", "content": "ping"}]},
        )
        self.assertEqual(plain.status_code, 200)
        self.assertEqual(plain.json()["choices"][0]["message"]["content"], "pong")

        stats = (await self.http.get("/api/stats")).json()
        self.assertEqual(stats["requests"], 3)
        self.assertEqual(stats["failure"], 1)
        self.assertEqual(stats["success"], 2)
        self.assertEqual(stats["tokens_in"], 6)
        self.assertEqual(stats["tokens_out"], 2)
        self.assertEqual(len(stats["recent"]), 3)
        self.assertEqual(stats["keys"]["openai"], "sk-…enai")
        self.assertNotIn("sk-ant-test", json.dumps(stats))
        page = await self.http.get("/")
        self.assertIn("/api/stats", page.text)
        self.assertNotIn("sk-ant-test", page.text)

    async def test_empty_key_and_dashboard_token(self):
        app = create_app(
            {
                "GATEWAY_API_KEY": "gate-test",
                "OPENAI_API_KEY": "",
                "ANTHROPIC_API_KEY": "",
                "DASHBOARD_TOKEN": "dash-secret",
            },
            httpx.AsyncClient(transport=httpx.MockTransport(lambda request: (_ for _ in ()).throw(AssertionError(request.url)))),
        )
        http = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://127.0.0.1")
        res = await http.post(
            "/v1/chat/completions",
            headers={"authorization": "Bearer gate-test"},
            json={"model": "claude-haiku-4-5", "messages": [{"role": "user", "content": "ping"}]},
        )
        self.assertEqual(res.status_code, 401)
        self.assertIn("ANTHROPIC_API_KEY is empty", res.text)
        self.assertEqual((await http.get("/")).status_code, 401)
        ok = await http.get("/api/stats", headers={"x-dashboard-token": "dash-secret"})
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json()["keys"]["anthropic"], "not set")
        await http.aclose()


if __name__ == "__main__":
    unittest.main()
