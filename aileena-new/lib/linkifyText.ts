/**
 * Pure URL splitter for console answer text (rendered by AgentChat linkify).
 * URL bodies are ASCII URL characters only, so a match stops at CJK text or
 * fullwidth punctuation (，。、）) instead of swallowing it. Parens are not URL
 * body characters (same as before), so "(https://x.y/z)" stops at ")".
 * Trailing ASCII sentence punctuation is handed back to the surrounding text.
 */
export type LinkPart = string | { url: string };

// Full http(s) URL, or a bare domain.tld/path the LLM sometimes emits.
const URL_RE =
  /(https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'*+,;=%]+|(?:[a-z0-9-]+\.)+[a-z]{2,}\/[A-Za-z0-9\-._~:/?#[\]@!$&'*+,;=%]+)/gi;
const TRAILING = /[.,;:!?'"]+$/;

export function splitLinks(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  const re = new RegExp(URL_RE.source, URL_RE.flags);
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const url = m[0].replace(TRAILING, '');
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ url });
    last = m.index + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
