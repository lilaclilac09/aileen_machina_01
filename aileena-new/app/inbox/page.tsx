import type { Metadata } from 'next';
import Link from 'next/link';
import { getOwnerIdentity } from '@/lib/owner-gate';
import OwnerChatInboxClient from '@/components/OwnerChatInboxClient';

export const metadata: Metadata = {
  title: 'Chat inbox · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Owner console transcript inbox — Redis durable forwards (~90d since 2026-08-04).
 * Gate: OWNER_KEY session via /api/auth/owner?key=…&next=/inbox
 */
export default async function InboxPage() {
  const owner = await getOwnerIdentity();
  const locked = !owner;

  return (
    <main className="min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713]">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10 sm:py-14">
        <header className="mb-8 space-y-2">
          <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
            owner · console
          </p>
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight text-[#1b1713]">
            Chat inbox
          </h1>
          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
            Auto-forwarded Console sessions. Redis keeps ~90 days from 4 Aug 2026 onward. Anything
            older lives only in your email / Resend (subject{' '}
            <span className="text-[#008f86]">[AILEENA Chat …]</span>).
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
            <Link href="/" className="hover:text-[#008f86]">
              ← home
            </Link>
            <span className="mx-2">·</span>
            <Link href="/council" className="hover:text-[#008f86]">
              council
            </Link>
          </p>
        </header>

        <OwnerChatInboxClient locked={locked} />
      </div>
    </main>
  );
}
