# Machina + GitHub MCP: let an agent edit your own repo

Anyone can point their own MCP client (Claude Desktop, Claude Code, Cursor,
VS Code) at two servers at once:

1. **Machina** (`https://www.aileena.xyz/api/mcp`), public and free, no
   sign-in. Its `suggest_patch` tool runs Machina's code-editing loop over
   files you send and returns diffs. **It has no access to any repo** and
   never sees a GitHub token.
2. **GitHub's official MCP server** (`https://api.githubcopilot.com/mcp/`),
   signed in as *you*, in *your* client. It reads your files and opens the
   pull request.

Your client is the glue: it fetches files with GitHub MCP, asks Machina for a
patch, and applies the patch on a new branch with a PR. Credentials stay in
your client, and the website never holds write access to your code.

## Config

**Cursor** (`~/.cursor/mcp.json` or `.cursor/mcp.json` in a project):

```json
{
  "mcpServers": {
    "aileena": { "url": "https://www.aileena.xyz/api/mcp" },
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer <your GitHub fine-grained token>" }
    }
  }
}
```

**Claude Code:**

```shell
claude mcp add --transport http aileena https://www.aileena.xyz/api/mcp
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  -H "Authorization: Bearer <your GitHub fine-grained token>"
```

**VS Code** (`.vscode/mcp.json`; VS Code can sign in to GitHub with OAuth, no token needed):

```json
{
  "servers": {
    "aileena": { "type": "http", "url": "https://www.aileena.xyz/api/mcp" },
    "github": { "type": "http", "url": "https://api.githubcopilot.com/mcp/" }
  }
}
```

**Claude Desktop:** Settings → Connectors → Add custom connector, once for
each URL.

For the GitHub token, use a fine-grained token limited to the repos you want,
with **Contents: Read and write** and **Pull requests: Read and write**. For a
read-only trial, use `https://api.githubcopilot.com/mcp/readonly` and apply
the diff yourself.

## Prompt to try

> Use GitHub MCP to read `README.md` and `src/app.ts` from `me/my-repo`.
> Send them to aileena `suggest_patch` with the task "fix the typos in the
> README". Then create a branch `machina/typos`, push the changed files with
> `push_files`, and open a draft pull request. Do not push to the default
> branch.

## `suggest_patch`

| Input | |
| --- | --- |
| `task` | what to change, up to 2,000 characters |
| `files` | `[{ path, content }]`, up to 20 files and 200 KB in total |
| `repo` | optional `owner/repo` label, for context only |

It returns a summary, a unified diff for each changed file (applies with
`git apply`), and the full new content (feed it straight to `push_files` or
`create_or_update_file`).

Guardrails: `.env*`, keys, `secrets*`, `credentials*`, `.git/` and CI
workflows are skipped and never reach the model. File contents are fenced as
untrusted data. At most 8 model steps and 8 changed files per call. Rate limit
of 2 calls a minute and 10 a day per caller, plus 200 a day across all callers.
The audit log keeps paths and sizes only; no code and no task text.

## Not built yet: Machina as a GitHub MCP client (off)

The alternative design: the site signs visitors in with a GitHub OAuth App
and Machina itself calls `api.githubcopilot.com/mcp` with the visitor's token.
It is **not implemented**; option 1 above gives the same result without the
site ever holding a write token. If it is built later, it should stay behind
`AGENT_CODE_GITHUB_MCP=1` (off by default) and follow these rules:

- **OAuth App** (github.com → Settings → Developer settings → OAuth Apps → New):
  Homepage `https://www.aileena.xyz`; callback
  `https://www.aileena.xyz/api/agent/code/github/callback`; scope `repo`
  (OAuth Apps have no finer scope for private repos; `public_repo` for public
  repos only). Env: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`.
- Keep the token only in an encrypted, HttpOnly session cookie (AES-GCM via
  `PRIVATE_DATA_ENCRYPTION_KEY`, 1-hour expiry). Never write it to Redis or logs.
- Same guardrails as owner code mode: branch and draft PR only, the denylist,
  per-turn caps, a per-visitor daily cap, action IDs, repo content treated as
  untrusted.
