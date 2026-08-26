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
 * Alias of /cabinet — owner transcript store.
 */
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const owner = await getOwnerIdentity();
  const locked = !owner;
  const denied = (await searchParams).error === 'denied';

  return (
    <main className="min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713]">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10 sm:py-14">
        <header className="mb-8 space-y-2">
          <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
            owner · cabinet
          </p>
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight text-[#1b1713]">
            cabinet
          </h1>
          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
            Same room as <span className="text-[#008f86]">/cabinet</span>. Console
            transcripts, ~90 days from 4 Aug 2026. Older notes live in mail / Resend.
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
            <Link href="/council" className="hover:text-[#008f86]">
              ← council
            </Link>
            <span className="mx-2">·</span>
            <Link href="/cabinet" className="hover:text-[#008f86]">
              cabinet
            </Link>
            <span className="mx-2">·</span>
            <Link href="/evolution" className="hover:text-[#008f86]">
              proof queue
            </Link>
          </p>
        </header>

        {locked ? (
          <div className="border border-[#ded8ce] bg-white px-5 py-6 space-y-4 max-w-xl">
            <OwnerUnlockForm next="/inbox" enterLabel="enter cabinet" denied={denied} />
          </div>
        ) : (
          <OwnerChatInboxClient locked={false} />
        )}
      </div>
    </main>
  );
}
