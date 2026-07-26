/** Catches example strings pasted verbatim (…, user:pass, ep-xxxx). */
export function looksLikePlaceholderUrl(url: string): boolean {
  return /…|\.\.\.|user:pass|ep-xxxx|<[^>]+>|YOUR_/i.test(url);
}

export function databaseUrlCheck(raw: string | undefined): {
  ok: boolean;
  detail: string;
} {
  const url = (raw || "").trim();
  if (!url) return { ok: false, detail: "missing" };
  if (looksLikePlaceholderUrl(url)) {
    return {
      ok: false,
      detail:
        "looks like the example string, not a real URI — copy the connection string from the Neon dashboard",
    };
  }
  if (/^postgres(ql)?:\/\//i.test(url)) return { ok: true, detail: "postgres" };
  if (/^file:/i.test(url)) return { ok: true, detail: "sqlite (local only)" };
  return { ok: false, detail: "not a postgres URI" };
}
