# KeyShield live — `app.ks.aileena.xyz`

Public vault UI is `/ks` in `aileena-new/`. Same Vercel project as aileena.xyz.

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
# {"ok":true,"method":"keyshield","doors":["wallet","passkey"],"railway":false}
```

Until those two clicks exist, use `https://www.aileena.xyz/ks` after this PR is on production.

Browser extension install (unpacked, no Chrome Web Store listing yet):

`https://github.com/lilaclilac09/keyshield/tree/main/src/extension`

Chromium: `chrome://extensions` → Developer mode → Load unpacked → `src/extension`.
