export type OwnerBrowseCommand =
  | { kind: 'status' }
  | { kind: 'prepare'; task: string };

/**
 * Owner-only site-agent browse lines. Narrow so ordinary questions
 * stay on retrieval tools. Visitors never match this.
 */
export function parseOwnerBrowseCommand(text: string): OwnerBrowseCommand | null {
  const raw = text.trim();
  if (!raw || raw.length > 2000) return null;

  if (/^browser use status\s*$/i.test(raw) || /^browse status\s*$/i.test(raw)) {
    return { kind: 'status' };
  }

  const labeled = /^(?:browse|browser use):\s*(.+)$/i.exec(raw);
  if (labeled) {
    return { kind: 'prepare', task: labeled[1].trim().slice(0, 4000) };
  }

  const withUrl = /^browse\s+(https?:\/\/\S+)(.*)$/i.exec(raw);
  if (withUrl) {
    const url = withUrl[1];
    const rest = withUrl[2].trim();
    return {
      kind: 'prepare',
      task: (rest ? `${url} ${rest}` : `Open ${url} and tell me the page title.`).slice(0, 4000),
    };
  }

  if (
    /screenshot|take pictures of/i.test(raw) &&
    /(\/daily|\/sound|landing|mobile|aileena\.xyz)/i.test(raw)
  ) {
    return { kind: 'prepare', task: raw.slice(0, 4000) };
  }

  return null;
}
