// Deterministic assertions for one site-agent turn. Zero dependencies.

/** Accept Python-style inline flags ("(?i)", "(?im)") so case files stay portable. */
export function toRegex(src) {
  const m = /^\(\?([a-z]+)\)/.exec(src);
  const flags = m ? m[1].replace(/[^gimsuy]/g, '') : '';
  return new RegExp(m ? src.slice(m[0].length) : src, flags);
}

/** Rough sentence count: terminal punctuation in EN/DE/ZH, ignoring URLs. */
export function countSentences(text) {
  const t = text.replace(/https?:\/\/\S+/g, 'URL').trim();
  if (!t) return 0;
  const parts = t.split(/(?<=[.!?。！？])\s*/).filter((s) => s.replace(/[\s\p{P}]/gu, '').length > 2);
  return parts.length;
}

/** Cheap language guess good enough for EN / DE / ZH routing checks. */
export function detectLanguage(text) {
  const t = text.replace(/https?:\/\/\S+/g, ' ');
  const han = (t.match(/\p{Script=Han}/gu) || []).length;
  const latin = (t.match(/[A-Za-zÄÖÜäöüß]/g) || []).length;
  // Product names and URLs stay Latin inside Chinese answers, so count Han chars, not ratio alone.
  if (han >= 8 || (han > 0 && han * 4 >= latin)) return 'zh';
  const words = t.toLowerCase().match(/[a-zäöüß]+/g) || [];
  const de = new Set(['und', 'der', 'die', 'das', 'ist', 'nicht', 'sie', 'mit', 'auf', 'für', 'ein', 'eine', 'arbeitet', 'gerade', 'auch', 'ihre', 'zu', 'den', 'im', 'an']);
  const en = new Set(['the', 'and', 'is', 'she', 'her', 'with', 'on', 'for', 'a', 'an', 'to', 'of', 'in', 'it', 'works', 'what']);
  let d = 0;
  let e = 0;
  for (const w of words) {
    if (de.has(w)) d++;
    if (en.has(w)) e++;
  }
  if (/[äöüß]/i.test(t)) d += 2;
  return d > e ? 'de' : 'en';
}

export function runChecks(c, res, canaries) {
  const ex = c.expect || {};
  const out = [];
  const push = (name, ok, detail, severity = 'fail') => out.push({ name, ok, severity, detail });
  const text = res.text || '';
  const body = res.rawBody || '';

  if (ex.status !== undefined) push('status', res.status === ex.status, `got ${res.status}, want ${ex.status}`);
  for (const [k, v] of Object.entries(ex.headers || {})) {
    const got = res.headers[k.toLowerCase()];
    push(`header ${k}`, got === v, `got ${got ?? '∅'}, want ${v}`);
  }
  for (const r of ex.bodyRegex || []) push(`body ~ ${r}`, toRegex(r).test(body), body.slice(0, 160));
  for (const r of ex.allRegex || []) push(`text ~ ${r}`, toRegex(r).test(text), 'missing');
  if (ex.anyRegex?.length) {
    const ok = ex.anyRegex.some((r) => toRegex(r).test(text));
    push(`text ~ any(${ex.anyRegex.length})`, ok, ok ? '' : 'none matched');
  }
  for (const r of ex.notRegex || []) {
    const m = text.match(toRegex(r));
    push(`text !~ ${r}`, !m, m ? `matched "${m[0].slice(0, 80)}"` : '');
  }
  for (const r of ex.warnRegex || []) push(`[warn] text ~ ${r}`, toRegex(r).test(text), 'missing', 'warn');
  for (const r of ex.warnNotRegex || []) {
    const m = text.match(toRegex(r));
    push(`[warn] text !~ ${r}`, !m, m ? `matched "${m[0].slice(0, 80)}"` : '', 'warn');
  }
  if (ex.noCanaries) {
    const hits = canaries.filter((s) => text.includes(s));
    push('no system-prompt canaries', hits.length === 0, hits.join(' | '));
  }
  if (ex.maxSentences !== undefined) {
    const n = countSentences(text);
    push(`≤ ${ex.maxSentences} sentences`, n <= ex.maxSentences, `got ${n}`, 'warn');
  }
  if (ex.language) {
    const lang = detectLanguage(text);
    push(`language=${ex.language}`, lang === ex.language, `detected ${lang}`);
  }
  if (ex.noToolCalls) push('no tool calls', res.tools.length === 0, res.tools.join(','));
  for (const t of ex.toolsCalled || []) push(`tool ${t} called`, res.tools.includes(t), `called: ${res.tools.join(',') || 'none'}`);
  if (ex.toolsAnyOf?.length) {
    push(`tool any(${ex.toolsAnyOf.join('|')})`, ex.toolsAnyOf.some((t) => res.tools.includes(t)), `called: ${res.tools.join(',') || 'none'}`);
  }
  if (res.status === 200 && !text.trim()) push('non-empty reply', false, res.streamError || 'empty stream');
  if (res.streamError) push('no stream error', false, res.streamError);
  return out;
}

/** Passive, request-free checks over headers the run already received. */
export function passiveSecurityChecks(results) {
  const findings = [];
  const quotaCookies = results.flatMap((r) => (r.setCookies || []).filter((s) => s.startsWith('__aileena_quota=')));
  if (quotaCookies.length) {
    const val = decodeURIComponent(quotaCookies[0].split(';')[0].split('=').slice(1).join('='));
    const signed = val.includes('.');
    let decoded = '';
    try {
      decoded = Buffer.from(val.split('.')[0], 'base64').toString('utf8');
    } catch {}
    findings.push({
      id: 'quota-cookie-signed',
      ok: signed,
      severity: signed ? 'info' : 'medium',
      detail: signed
        ? 'Quota cookie carries an HMAC signature.'
        : `Quota cookie is unsigned base64 JSON (${decoded}). CHAT_QUOTA_SECRET appears unset in this environment, so the 20/day cap is client-forgeable; dropping the cookie also resets it.`,
    });
  }
  const sysChars = results.map((r) => r.headers['x-system-prompt-chars']).find(Boolean);
  if (sysChars) {
    findings.push({
      id: 'debug-headers-exposed',
      ok: false,
      severity: 'low',
      detail: `Responses expose X-System-Prompt-Chars=${sysChars}, X-Session-Tail-Chars, X-Provider, X-Tool-Route, X-Model-Budget-Ms. Useful for this harness; also a free fingerprint for anyone probing the prompt.`,
    });
  }
  return findings;
}
