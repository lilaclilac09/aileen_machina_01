/**
 * Visitor locale for the site agent: EN / DE / ZH.
 *
 * Used for the reply-language note in the session tail and for the crisis
 * copy, which must give lines that work where the visitor most likely is.
 * Numbers checked 2026-10-16 against the operators' own pages:
 * - 12356: nhc.gov.cn (national psychological assistance hotline, all 31 provinces since 2025-05-01)
 * - 2389 2222: sbhk.org.hk (Samaritan Befrienders Hong Kong, 24h)
 * - 1925: mohw.gov.tw (安心專線, 24h)
 * - 0800 111 0 111 / 0800 111 0 222 / 116 123: telefonseelsorge.de (24h, free)
 * - 988: US Suicide & Crisis Lifeline; findahelpline.com for every other country
 */

export type VisitorLocale = 'en' | 'de' | 'zh';

const DE_WORDS = new Set([
  'und', 'der', 'die', 'das', 'ist', 'nicht', 'sie', 'ich', 'mit', 'auf', 'für', 'ein', 'eine',
  'woran', 'arbeitet', 'gerade', 'auch', 'ihre', 'zu', 'den', 'im', 'was', 'denke', 'bin', 'habe',
  'du', 'wir', 'es', 'sich', 'sehr', 'heute', 'über', 'gibt', 'mein', 'meine', 'macht', 'welche', 'wie', 'bitte', 'kurz',
  'mich', 'mir', 'kann', 'will', 'mehr', 'warum', 'wer', 'sind', 'hat', 'deutsch',
]);
const EN_WORDS = new Set([
  'the', 'and', 'is', 'she', 'her', 'with', 'on', 'for', 'a', 'to', 'of', 'in', 'it',
  'what', 'who', 'how', 'does', 'i', 'you', 'my', 'me', 'can', 'want', 'are', 'has', 'english',
]);

export function detectLocale(text: string): VisitorLocale {
  const t = (text || '').replace(/https?:\/\/\S+/g, ' ');
  const han = (t.match(/\p{Script=Han}/gu) || []).length;
  if (han >= 2) return 'zh';
  const words = t.toLowerCase().match(/[a-zäöüß]+/g) || [];
  let de = /[äöüß]/i.test(t) ? 2 : 0;
  let en = 0;
  for (const w of words) {
    if (DE_WORDS.has(w)) de++;
    if (EN_WORDS.has(w)) en++;
  }
  return de > en ? 'de' : 'en';
}

export function replyLanguageNote(locale: VisitorLocale): string {
  if (locale === 'zh') return 'Reply language: Chinese (简体中文). The visitor wrote in Chinese; keep product names and URLs as they are.';
  if (locale === 'de') return 'Reply language: German. The visitor wrote in German.';
  return 'Reply language: English, unless the visitor asks for another language.';
}

const CRISIS_RE =
  /suicid|kill myself|end my life|want to die|don'?t want to (live|be alive)|self[- ]harm|不想活|自杀|自殺|想死|轻生|輕生|活不下去|自残|自殘|suizid|selbstmord|umbringen|nicht mehr leben|will sterben|mich töten/i;

export function isCrisisMessage(text: string): boolean {
  return CRISIS_RE.test(text || '');
}

export const CRISIS_LINES: Record<VisitorLocale, string> = {
  zh: '这桌还在。你现在的怕和痛我听见了。如果你有危险，请现在就打电话：中国大陆 12356（全国心理援助热线）；香港 2389 2222（撒玛利亚防止自杀会，24 小时）；台湾 1925（安心专线，24 小时）。紧急情况打 120 或 110（香港 999）。在别的国家：https://findahelpline.com 。不给方法。我还在这里。',
  de: 'Ich bin noch da. Ich höre, wie sehr es gerade wehtut. Wenn du in Gefahr bist, ruf jetzt an: TelefonSeelsorge 0800 111 0 111, 0800 111 0 222 oder 116 123 – kostenlos, anonym, rund um die Uhr. Im Notfall 112. In einem anderen Land: https://findahelpline.com. Keine Methoden. Ich bleibe hier.',
  en: "I'm still here, and I hear how much this hurts. If you're in danger right now: in the US, call or text 988. Anywhere else, https://findahelpline.com lists free 24/7 lines for your country. In an emergency, call your local emergency number. No methods. I'm staying here.",
};

/** Pre-model crisis reply in the visitor's language, or null when the line is not a crisis line. */
export function crisisReply(text: string): string | null {
  if (!isCrisisMessage(text)) return null;
  return CRISIS_LINES[detectLocale(text)];
}
