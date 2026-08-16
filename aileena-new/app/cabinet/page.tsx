import type { Metadata } from 'next';
import Link from 'next/link';
import { getOwnerIdentity } from '@/lib/owner-gate';
import OwnerChatInboxClient from '@/components/OwnerChatInboxClient';
import OwnerUnlockForm from '@/components/OwnerUnlockForm';

export const metadata: Metadata = {
  title: 'Cabinet · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Owner filing cabinet — visitor console transcripts + leave-a-note mail trail.
 * Same store as /inbox. Unlock from this page or from /council.
 */
export default async function CabinetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const owner = await getOwnerIdentity();
  const locked = !owner;
  const denied = (await searchParams).error === 'denied';

  return (
    <main className="mobile-page min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10 sm:py-14 pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+2.5rem))]">
        <header className="mb-8 space-y-2">
          <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
            owner · cabinet
          </p>
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight text-[#1b1713]">
            cabinet
          </h1>
          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
            The filing cabinet. Auto-forwarded Console sessions live here (~90 days
            from 4 Aug 2026). Older notes are in mail / Resend (subject{' '}
            <span className="text-[#008f86]">[AILEENA Chat …]</span>).
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] uppercase text-[#1b1713]/40">
            private · not on the public orb
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
            <Link href="/council" className="hover:text-[#008f86]">
              ← council
            </Link>
            <span className="mx-2">·</span>
            <Link href="/" className="hover:text-[#008f86]">
              home
            </Link>
          </p>
        </header>

        {locked ? (
          <div className="border border-[#ded8ce] bg-white px-5 py-6 space-y-4 max-w-xl">
            <p className="text-[0.9rem] leading-relaxed text-[#1b1713]/70">
              Cabinet is owner-only. Same key as council.
            </p>
            <OwnerUnlockForm next="/cabinet" enterLabel="enter cabinet" denied={denied} />
          </div>
        ) : (
          <OwnerChatInboxClient locked={false} />
        )}
      </div>
    </main>
  );
}
