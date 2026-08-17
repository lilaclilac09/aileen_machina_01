export function buildChatBody({
  model,
  messages,
  stream = false,
  thinking = false,
  reasoningEffort = 'high',
}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }
  const body = {
    model,
    messages,
    stream: Boolean(stream),
    thinking: { type: thinking ? 'enabled' : 'disabled' },
  };
  if (thinking) body.reasoning_effort = reasoningEffort;
  return body;
}

export function redact(text, apiKey) {
  if (!text) return text;
  let out = String(text);
  if (apiKey) out = out.split(apiKey).join('[redacted-key]');
  return out.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted-key]');
}

export function parseSseDataLines(chunk) {
  const events = [];
  for (const line of String(chunk).split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (!data) continue;
    if (data === '[DONE]') {
      events.push({ done: true });
      continue;
    }
    try {
      events.push({ done: false, json: JSON.parse(data) });
    } catch {
      events.push({ done: false, raw: data });
    }
  }
  return events;
}

export function extractDelta(json) {
  const choice = json?.choices?.[0];
  const delta = choice?.delta || {};
  const message = choice?.message || {};
  return {
    content: delta.content ?? message.content ?? '',
    reasoning: delta.reasoning_content ?? message.reasoning_content ?? '',
    finishReason: choice?.finish_reason ?? null,
  };
}

async function readJsonOrText(res) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

export async function deepseekRequest(cfg, { method, path, body, signal }) {
  const url = `${cfg.baseURL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  return res;
}

export async function listModels(cfg, { signal } = {}) {
  const res = await deepseekRequest(cfg, { method: 'GET', path: '/models', signal });
  const { json, text } = await readJsonOrText(res);
  if (!res.ok) {
    throw new Error(redact(`DeepSeek /models ${res.status}: ${text}`, cfg.apiKey));
  }
  return json;
}

export async function getBalance(cfg, { signal } = {}) {
  const res = await deepseekRequest(cfg, { method: 'GET', path: '/user/balance', signal });
  const { json, text } = await readJsonOrText(res);
  if (!res.ok) {
    throw new Error(redact(`DeepSeek /user/balance ${res.status}: ${text}`, cfg.apiKey));
  }
  return json;
}

export async function chatCompletion(cfg, {
  messages,
  stream = false,
  thinking = cfg.thinking,
  reasoningEffort = 'high',
  onDelta,
  signal,
} = {}) {
  const body = buildChatBody({
    model: cfg.model,
    messages,
    stream,
    thinking,
    reasoningEffort,
  });
  const res = await deepseekRequest(cfg, {
    method: 'POST',
    path: '/chat/completions',
    body,
    signal,
  });

  if (!stream) {
    const { json, text } = await readJsonOrText(res);
    if (!res.ok) {
      throw new Error(redact(`DeepSeek /chat/completions ${res.status}: ${text}`, cfg.apiKey));
    }
    const extracted = extractDelta(json);
    return {
      content: extracted.content || '',
      reasoning: extracted.reasoning || '',
      finishReason: extracted.finishReason,
      raw: json,
    };
  }

  if (!res.ok) {
    const { text } = await readJsonOrText(res);
    throw new Error(redact(`DeepSeek /chat/completions ${res.status}: ${text}`, cfg.apiKey));
  }

  let content = '';
  let reasoning = '';
  let finishReason = null;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\n\n/);
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      for (const event of parseSseDataLines(part)) {
        if (event.done) continue;
        if (!event.json) continue;
        const extracted = extractDelta(event.json);
        if (extracted.content) {
          content += extracted.content;
          onDelta?.({ type: 'content', text: extracted.content });
        }
        if (extracted.reasoning) {
          reasoning += extracted.reasoning;
          onDelta?.({ type: 'reasoning', text: extracted.reasoning });
        }
        if (extracted.finishReason) finishReason = extracted.finishReason;
      }
    }
  }
  return { content, reasoning, finishReason, raw: null };
}
