# KeyShield live — `app.ks.aileena.xyz` · marketing `ks.aileena.xyz`

Public vault UI is `/ks` in `aileena-new/`. Same Vercel project as aileena.xyz.
Marketing landing is the original `keyshield/sites/landing` HTML at `/ks-landing` and on host `ks.aileena.xyz`.

Door matches the live SPA at `keyshield-sync-worker.vercel.app`:

- **Wallet first** — Phantom · Solflare · Backpack · OKX (injected providers, ed25519 sign)
- **Passkey second** — not automatic. Register once on this site, then Face ID / Touch ID / iCloud Keychain (Apple Passkeys) unlock. Other sites' iCloud passkeys are not imported. RP ID is `aileena.xyz`. `/.well-known/webauthn` + `/.well-known/passkey-endpoints` are the Apple / Passwords hooks.
- Dashboard tabs: Vault, Activity, Agents, Sharing, Sessions, Settings, Developer, Docs, Reports, X402 Trust

Crypto is `lib/keyshield` (`keyshield-prf-v1:*`). Wallet IKM is `SHA-256(sig of keyshield-prf-v1:vault-master-secret)` then the same HKDF as PRF. Server stores ciphertext only. The login signature never includes the vault IKM.

The old SPA still talks to a dead Railway API (`keyshield-production.up.railway.app` → 404) and uses `ks-prf-salt-v1`. Do not point `app.ks` at that project.

Rust proxy / MPP / x402 meters stay unbound until `api.ks` / `sync.ks` exist. Activity shows that honestly — no fake call counts.

## Manual steps (owner)

Cloud Agent cannot add Cloudflare DNS or a Vercel custom domain.

### 1. Vercel domain

On the **aileena.xyz / aileen-machina-01** project (root = `aileena-new`):

Settings → Domains → Add `app.ks.aileena.xyz`

`ks.aileena.xyz` is already on the **keyshield-landing** Vercel project (`prj_KRVd7hA59ozWSLAZQ25noZpRKdkq`). Do not steal that domain onto this Next app unless you also remove it there.

### 2. Cloudflare DNS

`aileena.xyz` NS is Cloudflare (`jason.ns.cloudflare.com`).

DNS → Add record:

- Type: `CNAME`
- Name: `app.ks`
- Target: `cname.vercel-dns.com` (or the value Vercel shows)
- Proxy: DNS only (grey cloud) unless Vercel says otherwise

Second record (marketing). Vercel already has `ks.aileena.xyz` on **keyshield-landing**. The page is live at:

https://keyshield-landing.vercel.app → production deploy `dpl_9ehtxkM88AaYS3PXX6yXd9yvRCyn` (`f40e177`, original `sites/landing`).

`ks.aileena.xyz` is still NXDOMAIN until this record exists:

- Type: `CNAME`
- Name: `ks`
- Target: `came.vercel-dns.com` (same family as `app.ks`) or the value Vercel shows on keyshield-landing → Domains
- Proxy: DNS only (grey cloud)

### 3. Confirm

```bash
dig +short app.ks.aileena.xyz CNAME
curl -sS https://app.ks.aileena.xyz/api/ks/health
# {"ok":true,"method":"keyshield","doors":["wallet","passkey"],"railway":false}

dig +short ks.aileena.xyz CNAME
curl -sSI https://ks.aileena.xyz
# 200 + title KeyShield — Stop copy-pasting API keys.
```

Until the `ks` CNAME exists, use https://keyshield-landing.vercel.app (or `/ks-landing` on this site after deploy). After DNS is up, point the `keyshield-landing.vercel.app` 307 back to `ks.aileena.xyz`.

Browser extension install (unpacked, no Chrome Web Store listing yet):

`https://github.com/lilaclilac09/keyshield/tree/main/src/extension`

Chromium: `chrome://extensions` → Developer mode → Load unpacked → `src/extension`.
