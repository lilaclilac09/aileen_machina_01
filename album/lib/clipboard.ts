/** Clipboard + Web Share helpers for WeChat / insecure contexts */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function shareOrCopy(opts: {
  title: string;
  url: string;
}): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) {
      await navigator.share({ title: opts.title, url: opts.url });
      return "shared";
    }
  } catch (err) {
    // user cancelled share — not a hard failure
    if (err instanceof Error && err.name === "AbortError") return "failed";
  }
  const ok = await copyText(opts.url);
  return ok ? "copied" : "failed";
}
