/**
 * Daily draw intent — Console trailing card.
 * Idle chat must not burn a draw. Only explicit card asks.
 */

const EXPLICIT =
  /抽牌|今日牌|今日一牌|抽一张|抽一张牌|算一卦|今日一卦|抽卦/;

/** Whole-utterance English / German commands. */
const COMMAND =
  /^\s*(draw|karte\s*ziehen|tageskarte)(\s+(a\s+)?(card|today|today'?s\s+card|the\s+card))?\s*[.!?。！？]*$/i;

export function isDrawIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (EXPLICIT.test(t)) return true;
  if (COMMAND.test(t)) return true;
  if (/^(today'?s|daily)\s+card\b/i.test(t)) return true;
  if (/^card of the day\b/i.test(t)) return true;
  if (/\btarot\b/i.test(t) && !/\b(code|patch|diff|git)\b/i.test(t)) return true;
  return false;
}
