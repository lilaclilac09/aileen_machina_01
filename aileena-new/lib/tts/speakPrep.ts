/**
 * Strip markup that sounds bad when read aloud.
 * Does not convert Simplified ↔ Traditional Chinese.
 */

const CODE_FENCE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`([^`]+)`/g;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;
const RAW_URL_RE = /https?:\/\/[^\s)>\]]+/gi;
const MD_HEADING_RE = /^#{1,6}\s+/gm;
const BOLD_RE = /(\*\*|__)(.*?)\1/g;
const ITALIC_RE = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g;

export function prepareSpeakText(raw: string): string {
  let text = String(raw ?? '');
  if (!text.trim()) return '';

  text = text.replace(CODE_FENCE_RE, ' ');
  text = text.replace(MD_LINK_RE, '$1');
  text = text.replace(INLINE_CODE_RE, '$1');
  text = text.replace(RAW_URL_RE, ' ');
  text = text.replace(MD_HEADING_RE, '');
  text = text.replace(BOLD_RE, '$2');
  text = text.replace(ITALIC_RE, '$1');

  const lines = text.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (/^\|.*\|$/.test(trimmed) || /^\s*\|?\s*:?-{3,}/.test(trimmed)) return '';
    return trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
  });

  return lines
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
