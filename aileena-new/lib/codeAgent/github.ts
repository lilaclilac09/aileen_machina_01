/**
 * Minimal GitHub REST client for code mode. The agent never writes to the
 * repo while it works: reads come from the base commit, edits are staged in
 * memory, and only the final steps create one commit on a fresh
 * `machina/code-*` branch and open a draft PR. Never the default branch.
 */

export type RepoRef = { owner: string; repo: string };

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function parseRepo(raw: string | undefined | null): RepoRef | null {
  const m = (raw ?? '').trim().match(/^([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

export class GitHub {
  constructor(
    private token: string,
    readonly ref: RepoRef,
    private base = (process.env.AGENT_CODE_GITHUB_API ?? '').trim() || 'https://api.github.com',
  ) {}

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.base}/repos/${this.ref.owner}/${this.ref.repo}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'machina-code-mode',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = text.slice(0, 200);
      try {
        msg = (JSON.parse(text) as { message?: string }).message ?? msg;
      } catch {
        /* keep raw */
      }
      throw new GitHubError(res.status, `GitHub ${method} ${path.split('?')[0]} → ${res.status}: ${msg}`);
    }
    return (text ? JSON.parse(text) : null) as T;
  }

  async defaultBranch(): Promise<{ branch: string; sha: string }> {
    const repo = await this.call<{ default_branch: string }>('GET', '');
    const ref = await this.call<{ object: { sha: string } }>('GET', `/git/ref/heads/${encodeURIComponent(repo.default_branch)}`);
    return { branch: repo.default_branch, sha: ref.object.sha };
  }

  /** Blob paths at a commit (recursive tree; GitHub truncates very large trees). */
  async listPaths(sha: string): Promise<string[]> {
    const t = await this.call<{ tree: { path: string; type: string }[] }>('GET', `/git/trees/${sha}?recursive=1`);
    return t.tree.filter((e) => e.type === 'blob').map((e) => e.path);
  }

  /** File text at a commit; null when missing. */
  async readFile(path: string, sha: string): Promise<string | null> {
    try {
      const f = await this.call<{ content?: string; encoding?: string; type?: string }>(
        'GET',
        `/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${sha}`,
      );
      if (f.type !== 'file' || typeof f.content !== 'string') return null;
      return Buffer.from(f.content, (f.encoding as BufferEncoding) || 'base64').toString('utf8');
    } catch (err) {
      if (err instanceof GitHubError && err.status === 404) return null;
      throw err;
    }
  }

  /** One commit with every staged file, parented on the base commit. */
  async createCommit(baseSha: string, files: Record<string, string>, message: string, author?: { name: string; email: string }): Promise<string> {
    const tree = await this.call<{ sha: string }>('POST', '/git/trees', {
      base_tree: baseSha,
      tree: Object.entries(files).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content })),
    });
    const commit = await this.call<{ sha: string }>('POST', '/git/commits', {
      message,
      tree: tree.sha,
      parents: [baseSha],
      ...(author ? { author } : {}),
    });
    return commit.sha;
  }

  /** Create the work branch. Idempotent: an existing branch already at `sha` is fine. */
  async createBranch(branch: string, sha: string, defaultBranch: string): Promise<void> {
    if (!branch.startsWith('machina/') || branch === defaultBranch) throw new Error('refusing to write outside a machina/* work branch');
    try {
      await this.call('POST', '/git/refs', { ref: `refs/heads/${branch}`, sha });
    } catch (err) {
      if (!(err instanceof GitHubError) || err.status !== 422) throw err;
      const cur = await this.call<{ object: { sha: string } }>('GET', `/git/ref/heads/${branch}`);
      if (cur.object.sha !== sha) throw new Error(`branch ${branch} already exists at another commit`);
    }
  }

  /** Open a draft PR, or return the open one for this branch (idempotent). */
  async openDraftPr(branch: string, base: string, title: string, body: string): Promise<{ url: string; number: number }> {
    const open = await this.call<{ html_url: string; number: number }[]>(
      'GET',
      `/pulls?state=open&head=${encodeURIComponent(`${this.ref.owner}:${branch}`)}`,
    );
    if (open.length) return { url: open[0].html_url, number: open[0].number };
    const pr = await this.call<{ html_url: string; number: number }>('POST', '/pulls', { title, head: branch, base, body, draft: true });
    return { url: pr.html_url, number: pr.number };
  }
}
