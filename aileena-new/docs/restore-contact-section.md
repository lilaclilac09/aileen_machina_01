# Restoring the "Send a message" contact section

The Resend-backed email contact form (`/api/send` + the SAT-LINK terminal form in `page.tsx`) was removed in **PR #59** to lean out the page. This doc is the self-contained kit to put it back when you want it. Everything you need is inlined here — you don't need to dig through git history.

The `resend` npm dependency was intentionally **left in `package.json`** so reinstalling isn't required.

---

## Quick checklist

1. Recreate `aileena-new/app/api/send/route.ts` (paste below).
2. Paste the contact `<SnapSection>` block back into `aileena-new/app/page.tsx`.
3. Re-add the form-state hooks at the top of the `Home` component.
4. Re-add the `contact` entries to `aileena-new/lib/translations.ts` (EN + DE).
5. Confirm `RESEND_API_KEY` is set in Vercel (Production + Preview).
6. Optional: re-wire the Open to Work "Get in touch" CTA to scroll to `#contact` instead of opening `mailto:`.

Reference commits, in case the inlined snippets ever rot:
- **PR #59** (`98f207b`): the removal — diff shows exactly what came out.
- The commit immediately before `98f207b` has the last working version.

```bash
git show 98f207b^:aileena-new/app/api/send/route.ts
git show 98f207b^:aileena-new/app/page.tsx
git show 98f207b^:aileena-new/lib/translations.ts
```

---

## 1. `app/api/send/route.ts`

```ts
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, email, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: 'AILEENA MACHINA <onboarding@resend.dev>',
    to: 'rosazxc0915@gmail.com',
    subject: `[AILEENA] Signal from ${name}`,
    text: `From: ${name}\nEmail: ${email}\n\n${message}`,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

---

## 2. Form-state hooks (top of `app/page.tsx`)

Add these to the `Home` component, just below `const [loaded, setLoaded] = useState(false);`:

```tsx
const [formName, setFormName] = useState('');
const [formEmail, setFormEmail] = useState('');
const [formMsg, setFormMsg] = useState('');
const [sending, setSending] = useState(false);
const [sent, setSent] = useState(false);
```

---

## 3. Contact `<SnapSection>` block

Drop this **before** the footer `<SnapSection>` block, and update the footer's order to `order-8` (the contact section takes `order-7`).

```tsx
{/* ── 07 CONTACT ── */}
<SnapSection id="contact" className="order-7">
  <div className="h-full flex flex-col justify-center bg-[#050505] px-5 sm:px-10 lg:px-16 py-10 sm:py-0">
    <div className="mx-auto w-full max-w-[1400px] grid gap-8 sm:gap-12 lg:gap-16 lg:grid-cols-[0.5fr_1fr] items-center">
      <div>
        <div className="anim-up flex items-center gap-2 sm:gap-3 mb-5 sm:mb-8">
          <div className="h-px flex-1" style={{ background: 'rgba(0,255,234,0.18)' }} />
          <span className="font-mono text-[0.52rem] sm:text-[0.58rem] tracking-[0.25em] sm:tracking-[0.5em] text-[#00ffea]/30">SAT-LINK · NODE-7</span>
          <div className="h-px flex-1" style={{ background: 'rgba(0,255,234,0.18)' }} />
        </div>
        <h2 className="anim-up-2 font-mono text-[clamp(1.9rem,4vw,4rem)] font-light tracking-[0.15em] text-white">{tx.contact.heading}</h2>
        <div className="anim-up-3 mt-8 space-y-2">
          <p className="font-mono text-[0.58rem] tracking-[0.4em] text-white/30">UPLINK · 2.4 GHz · SAT-A7</p>
          <p className="font-mono text-[0.58rem] tracking-[0.4em] text-white/30">ENCRYPTION · AES-256 · ACTIVE</p>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00ffea]/50 shadow-[0_0_6px_rgba(0,255,234,0.6)] animate-pulse" />
            <p className="font-mono text-[0.58rem] tracking-[0.4em] text-[#00ffea]/50">{tx.contact.standby}</p>
          </div>
        </div>
      </div>

      <div className="anim-left font-mono">
        <div className="flex items-center justify-between border border-[#00ffea]/10 px-4 py-2" style={{ background: 'rgba(0,255,234,0.025)' }}>
          <span className="text-[0.52rem] sm:text-[0.58rem] tracking-[0.2em] sm:tracking-[0.5em] text-[#00ffea]/40 uppercase">{tx.contact.terminal}</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00ffea]/55 shadow-[0_0_4px_rgba(0,255,234,0.5)] animate-pulse" />
          </div>
        </div>
        <div className="border border-t-0 border-[#00ffea]/10 p-5 space-y-0">
          <div className="border-b border-white/6 py-4">
            <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">{tx.contact.origin} ·</p>
            <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-transparent text-sm tracking-[0.2em] text-white/60 outline-none placeholder:text-white/25 focus:text-white/85" placeholder={tx.contact.name} />
          </div>
          <div className="border-b border-white/6 py-4">
            <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">{tx.contact.frequency} ·</p>
            <input value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full bg-transparent text-sm tracking-[0.2em] text-white/60 outline-none placeholder:text-white/25 focus:text-white/85" placeholder={tx.contact.email} />
          </div>
          <div className="border-b border-white/6 py-4">
            <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">{tx.contact.payload} ·</p>
            <textarea value={formMsg} onChange={e => setFormMsg(e.target.value)} className="w-full bg-transparent text-sm tracking-[0.2em] text-white/60 outline-none placeholder:text-white/25 focus:text-white/85 min-h-20 resize-none" placeholder={tx.contact.message} />
          </div>
          <div className="flex items-center justify-between gap-3 pt-5">
            <span className="text-[0.5rem] tracking-[0.2em] sm:tracking-[0.4em] text-white/20">
              {sent ? 'TRANSMISSION SENT ·' : 'PKT · AUTO · ENC · ON'}
            </span>
            <button
              disabled={sending || sent}
              onClick={async () => {
                setSending(true);
                await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formName, email: formEmail, message: formMsg }) });
                setSending(false);
                setSent(true);
                setFormName(''); setFormEmail(''); setFormMsg('');
              }}
              className="group flex items-center gap-2 hover:opacity-70 transition-opacity disabled:opacity-40"
            >
              <span className="text-[0.62rem] sm:text-[0.65rem] tracking-[0.28em] sm:tracking-[0.55em] text-[#00ffea]/70 group-hover:text-[#00ffea]">
                {sending ? 'SENDING...' : sent ? 'SENT ✓' : tx.contact.send}
              </span>
              {!sent && <span className="text-sm text-[#00ffea]/55 group-hover:text-[#00ffea] transition-colors">↗</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</SnapSection>
```

Then bump the footer's class from `order-7` back to `order-8`:

```tsx
<SnapSection className="order-8">
```

---

## 4. Translations (`lib/translations.ts`)

Add this to **both** `EN` and `DE` (the schema must mirror). Drop it just before each `footer:` block.

### EN

```ts
contact: {
  tag: 'Contact',
  heading: 'Send a message',
  name: 'Your name',
  email: 'Your email',
  message: 'Your message',
  send: 'Transmit',
  terminal: 'TERMINAL',
  origin: 'FROM',
  frequency: 'REPLY TO',
  payload: 'MESSAGE',
  standby: 'READY',
},
```

### DE

```ts
contact: {
  tag: 'Kontakt',
  heading: 'Nachricht senden',
  name: 'Dein Name',
  email: 'Deine E-Mail',
  message: 'Deine Nachricht',
  send: 'Senden',
  terminal: 'TERMINAL',
  origin: 'VON',
  frequency: 'ANTWORT AN',
  payload: 'NACHRICHT',
  standby: 'BEREIT',
},
```

---

## 5. Env var on Vercel

The route reads `RESEND_API_KEY` from `process.env`. Vercel → Project → Settings → Environment Variables. If it's already there from before, just redeploy so the new function picks it up. Otherwise add it under both Production and Preview.

Resend's email "from" address is currently `AILEENA MACHINA <onboarding@resend.dev>` — Resend's default test sender. Swap it for a verified domain sender (e.g. `agent@aileena.xyz`) when you set up DNS for Resend.

The destination email is hard-coded in the route: `rosazxc0915@gmail.com`.

---

## 6. Optional: re-wire the "Get in touch" CTA

After removal, the Open to Work CTA in `app/page.tsx` was changed to a `mailto:` link plus a secondary "Ask the agent" button. If you'd rather have the CTA scroll back to the contact section, replace the `mailto:` button with:

```tsx
<a
  href="#contact"
  className="inline-flex items-center gap-2 rounded-md border border-[#00ffea]/40 bg-[#00ffea]/5 px-5 py-3 font-mono text-xs tracking-[0.4em] uppercase text-[#00ffea] hover:bg-[#00ffea]/15 transition-colors no-underline"
>
  {tx.openToWork.cta}
</a>
```

The secondary "Ask the agent" button can stay or go.

---

## 7. Optional: update the agent system prompt

When the form is back, the agent should know about it. In `lib/agentContext.ts`, replace the "email rosazxc0915@gmail.com directly" lines with something like *"point the user to the SAT-LINK · NODE-7 / Send a message section near the bottom of this page; submitting it emails her directly"*.
