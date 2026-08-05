/**
 * Filename / path tags for Cafe Cursor priority media.
 * Folders: photos/girls/, photos/guys/, photos/smiles/ (optional)
 * Also matches 笑容/笑/smile and 男/guy in filenames.
 */

export type MediaTag = 'timelapse' | 'final' | 'girls' | 'guys' | 'smile' | 'priority';

const TIMELAPSE_RE =
  /延时|延時|timelapse|time[\s_-]?lapse|hyperlapse|延时摄影|延時攝影/i;
const FINAL_RE = /最后|最終|final|finale|closing/i;
const GIRLS_RE =
  /女|女孩|女生|姑娘|小姐姐|姐妹|girls?|women|woman|lad(?:y|ies)|female/i;
const GUYS_RE = /男|男生|小哥|兄弟|guys?|men|man|male|boy|先生/i;
const SMILE_RE = /笑容|微笑|笑|smile|smiling|laugh|开心|happy/i;

export function tagsForPath(relPath: string, filename: string): MediaTag[] {
  const hay = `${relPath} ${filename}`;
  const tags: MediaTag[] = [];

  if (/\/(?:girls|女孩子|女生|小姐姐)\//i.test(relPath)) tags.push('girls');
  if (/\/(?:guys|boys|男|男生)\//i.test(relPath)) tags.push('guys');
  if (/\/(?:smiles?|笑容|笑)\//i.test(relPath)) tags.push('smile');
  if (/\/(?:timelapse|延时|延時)\//i.test(relPath)) tags.push('timelapse');
  if (/\/(?:priority|_priority|must)\//i.test(relPath)) tags.push('priority');

  if (TIMELAPSE_RE.test(hay)) tags.push('timelapse');
  if (GIRLS_RE.test(hay)) tags.push('girls');
  if (GUYS_RE.test(hay)) tags.push('guys');
  if (SMILE_RE.test(hay)) tags.push('smile');
  // Cafe stills from guest camera (HM5A*) — treat as smile/people priority
  if (/^HM5A/i.test(filename)) tags.push('smile');

  if (
    (tags.includes('timelapse') && FINAL_RE.test(hay)) ||
    (tags.includes('timelapse') && /\/timelapse\//i.test(relPath)) ||
    (/最后.*延|延.*最后|final.*lapse|lapse.*final/i.test(hay))
  ) {
    tags.push('final');
    if (!tags.includes('timelapse')) tags.push('timelapse');
  }

  if (/\/timelapse\//i.test(relPath)) {
    if (!tags.includes('timelapse')) tags.push('timelapse');
    if (!tags.includes('final')) tags.push('final');
  }

  return [...new Set(tags)];
}

export function isTimelapse(tags: MediaTag[]): boolean {
  return tags.includes('timelapse');
}

export function isFinalTimelapse(tags: MediaTag[]): boolean {
  return tags.includes('timelapse') && (tags.includes('final') || tags.includes('priority'));
}

export function isGirls(tags: MediaTag[]): boolean {
  return tags.includes('girls');
}

export function isGuys(tags: MediaTag[]): boolean {
  return tags.includes('guys');
}

export function isSmile(tags: MediaTag[]): boolean {
  return tags.includes('smile');
}

export function pickTimelapseWindow(
  duration: number,
  opts: { min_s: number; max_s: number; preferEnd: boolean },
): { start: number; end: number } {
  if (duration <= 0) return { start: 0, end: opts.min_s };
  const win = Math.min(opts.max_s, Math.max(opts.min_s, duration * 0.35));
  if (duration <= win + 0.5) return { start: 0, end: duration };
  if (opts.preferEnd) {
    const start = Math.max(0, duration - win - 0.3);
    return { start, end: Math.min(duration, start + win) };
  }
  const start = Math.max(0.2, (duration - win) / 2);
  return { start, end: start + win };
}
