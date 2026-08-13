/**
 * Shared transcript formatting for lead + chat-forward Resend emails.
 */

export type MailTranscriptLine = {
  role: 'user' | 'assistant' | string;
  text: string;
  at?: string;
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function normalizeTranscript(transcript: unknown): MailTranscriptLine[] {
  if (!Array.isArray(transcript)) return [];
  const out: MailTranscriptLine[] = [];
  for (const m of transcript) {
    if (!m || typeof m !== 'object') continue;
    const roleRaw = (m as { role?: string }).role;
    const role =
      roleRaw === 'user' ? 'user' : roleRaw === 'assistant' ? 'assistant' : null;
    const textRaw =
      (m as { text?: unknown }).text ?? (m as { content?: unknown }).content;
    if (!role || typeof textRaw !== 'string' || !textRaw.trim()) continue;
    const atRaw =
      (m as { at?: unknown }).at ??
      (m as { createdAt?: unknown }).createdAt ??
      (m as { timestamp?: unknown }).timestamp;
    const at =
      typeof atRaw === 'string' && atRaw.trim()
        ? atRaw.trim()
        : atRaw instanceof Date
          ? atRaw.toISOString()
          : undefined;
    out.push({ role, text: textRaw.trim(), at });
  }
  return out;
}

export function renderTranscriptText(lines: MailTranscriptLine[]): string {
  if (lines.length === 0) return '(empty conversation)';
  return lines
    .map((m, i) => {
      const who = m.role === 'user' ? 'VISITOR' : 'AGENT';
      const ts = m.at ? ` · ${m.at}` : '';
      return `[${i + 1}] [${who}]${ts}\n${m.text}`;
    })
    .join('\n\n');
}

export function renderTranscriptHtml(lines: MailTranscriptLine[]): string {
  if (lines.length === 0) {
    return '<p style="color:#666">(empty conversation)</p>';
  }
  return lines
    .map((m, i) => {
      const who = m.role === 'user' ? 'VISITOR' : 'AGENT';
      const color = m.role === 'user' ? '#007d75' : '#1b1713';
      const ts = m.at
        ? ` <span style="color:#999;font-weight:400">${escapeHtml(m.at)}</span>`
        : '';
      return (
        `<div style="margin:0 0 14px">` +
        `<div style="font:600 11px ui-monospace,Menlo,monospace;letter-spacing:.08em;color:${color}">` +
        `${i + 1}. ${who}${ts}</div>` +
        `<div style="font:13px/1.55 ui-monospace,Menlo,monospace;color:#222;white-space:pre-wrap;margin-top:4px">` +
        `${escapeHtml(m.text)}</div></div>`
      );
    })
    .join('');
}

/** Soft public copy when mail backend is offline / misconfigured. */
export const CONTACT_OFFLINE_PUBLIC =
  'Note saving is offline right now. You can still copy this message and send it manually.';
