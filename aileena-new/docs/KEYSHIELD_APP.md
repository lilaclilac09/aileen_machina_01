# KeyShield live — `app.ks.aileena.xyz`

Public vault UI is `/ks` in `aileena-new/`. Same Vercel project as aileena.xyz.

Crypto is `lib/keyshield` (`keyshield-prf-v1:*`). Server stores ciphertext only.

The old SPA at `keyshield-sync-worker.vercel.app` still talks to a dead Railway API (`keyshield-production.up.railway.app` → 404) and uses `ks-prf-salt-v1`. Do not point `app.ks` at that project.

## Manual steps (owner)

Cloud Agent cannot add Cloudflare DNS or a Vercel custom domain.

### 1. Vercel domain

On the **aileena.xyz / aileen-machina-01** project (root = `aileena-new`):

Settings → Domains → Add `app.ks.aileena.xyz`

### 2. Cloudflare DNS

`aileena.xyz` NS is Cloudflare (`jason.ns.cloudflare.com`).

DNS → Add record:

- Type: `CNAME`
- Name: `app.ks`
- Target: `cname.vercel-dns.com` (or the value Vercel shows)
- Proxy: DNS only (grey cloud) unless Vercel says otherwise

### 3. Confirm

```bash
dig +short app.ks.aileena.xyz CNAME
curl -sS https://app.ks.aileena.xyz/api/ks/health
# {"ok":true,"method":"keyshield","prfFirst":"keyshield-prf-v1:vault-master-secret","railway":false}
```

Until those two clicks exist, use `https://www.aileena.xyz/ks` after this PR is on production.

`api.ks` / `sync.ks` stay unset. This slice does not revive the Rust proxy or the extension sync worker.
