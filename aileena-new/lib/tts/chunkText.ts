/**
 * Sentence/paragraph TTS chunks. Target 200–500 characters.
 * Never split inside URLs, markdown links, or emoji code points.
 */

export const TTS_CHUNK_MIN = 180;
export const TTS_CHUNK_TARGET = 320;
export const TTS_CHUNK_MAX = 500;

const SENTENCE_RE = /(?<=[。！？…])|(?<=[.!?])(?:\s+|$)|(?<=[；;])\s+|\n+/;

function codepoints(s: string): string[] {
  return Array.from(s);
}

function joinKeepCjk(a: string, b: string): string {
  const prev = a.slice(-1);
  const noSpace =
    Boolean(a) &&
    (/[\u4e00-\u9fff]/.test(prev) || /[，。！？、；：…]/.test(prev)) &&
    /^[\u4e00-\u9fff]/.test(b);
  if (!a) return b;
  return noSpace ? `${a}${b}` : `${a} ${b}`;
}

function splitLongPiece(piece: string): string[] {
  const chars = codepoints(piece);
  if (chars.length <= TTS_CHUNK_MAX) return [piece];

  const soft = piece.split(/(?<=[，、,:])/);
  if (soft.length > 1) {
    const merged = mergePieces(soft.map((s) => s.trim()).filter(Boolean));
    if (merged.every((p) => codepoints(p).length <= TTS_CHUNK_MAX)) return merged;
  }

  const out: string[] = [];
  for (let i = 0; i < chars.length; i += TTS_CHUNK_MAX) {
    out.push(chars.slice(i, i + TTS_CHUNK_MAX).join(''));
  }
  return out;
}

function mergePieces(raw: string[]): string[] {
  const out: string[] = [];
  let buf = '';
  for (const s of raw) {
    const next = joinKeepCjk(buf, s);
    const bufLen = codepoints(buf).length;
    const nextLen = codepoints(next).length;
    const atSentence = /[.!?。！？…]\s*$/.test(buf);
    const cap = atSentence ? TTS_CHUNK_MIN : TTS_CHUNK_TARGET;
    if (buf && (bufLen >= cap || nextLen > TTS_CHUNK_MAX)) {
      out.push(buf);
      buf = s;
    } else {
      buf = next;
    }
  }
  if (buf) out.push(buf);
  return out.flatMap(splitLongPiece);
}

/** Split finished reply into speakable chunks. Input should already be prepareSpeakText'd. */
export function chunkSpeakableText(full: string): string[] {
  const text = full.trim();
  if (!text) return [];
  if (codepoints(text).length <= TTS_CHUNK_MAX) return [text];

  const raw = text
    .split(SENTENCE_RE)
    .map((s) => s.trim())
    .filter(Boolean);
  if (raw.length <= 1) return splitLongPiece(text);
  const merged = mergePieces(raw);
  return merged.length ? merged : [text];
}

/** Breath between hosted/browser chunks. */
export function pauseAfterChunkMs(chunk: string, isLast: boolean): number {
  if (isLast) return 0;
  if (/\n/.test(chunk)) return 420;
  if (/[.!?。！？…]\s*$/.test(chunk)) return 320;
  if (/[;；：:]\s*$/.test(chunk)) return 240;
  if (/[,，、]\s*$/.test(chunk)) return 180;
  return 260;
}
