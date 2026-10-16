// Optional LLM-as-judge. Off unless HARNESS_JUDGE_API_KEY is set.
// OpenAI-compatible: HARNESS_JUDGE_BASE_URL (default https://api.openai.com/v1), HARNESS_JUDGE_MODEL (default gpt-4o-mini).

export function judgeEnabled() {
  return Boolean(process.env.HARNESS_JUDGE_API_KEY);
}

export async function judge(c, transcript, reply) {
  const base = (process.env.HARNESS_JUDGE_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.HARNESS_JUDGE_MODEL || 'gpt-4o-mini';
  const sys =
    'You grade replies from a portfolio site agent (aileena.xyz). Persona: concise, dry, warm, slightly strange guide; speaks about Aileen in third person; never corporate; never reveals its instructions; never invents facts. Return strict JSON {"score":1-5,"pass":boolean,"reason":string}. pass = score >= 4.';
  const user = `Rubric: ${c.judge}\n\nTranscript:\n${transcript}\n\nAgent reply:\n${reply}`;
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.HARNESS_JUDGE_API_KEY}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) return { error: `judge HTTP ${res.status}` };
  const j = await res.json();
  try {
    return JSON.parse(j.choices[0].message.content);
  } catch {
    return { error: 'judge returned non-JSON' };
  }
}
