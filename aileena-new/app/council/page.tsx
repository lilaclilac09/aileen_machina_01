import type { Metadata } from 'next';
import Link from 'next/link';
import { getOwnerIdentity } from '@/lib/owner-gate';
import CouncilChat from '@/components/CouncilChat';

export const metadata: Metadata = {
  title: 'Council · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Private council — owner only.
 * Unlock: /api/auth/owner?key=OWNER_KEY&next=/council
 */
export default async function CouncilPage() {
  const owner = await getOwnerIdentity();
  const locked = !owner;

  return (
    <main className="min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713]">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14">
        <header className="mb-8 space-y-2">
          <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
            owner · private council
          </p>
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight text-[#1b1713]">
            aileena council
          </h1>
          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
            War room, not the public guide. Strategy, negotiation, product,
            review, editor, political timing, or vent. Protects leverage and time.
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] uppercase text-[#1b1713]/40">
            private mode · no public transcript · no leave-a-note
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
            <Link href="/" className="hover:text-[#008f86]">
              ← home
            </Link>
            <span className="mx-2">·</span>
            <Link href="/inbox" className="hover:text-[#008f86]">
              inbox
            </Link>
          </p>
        </header>

        {locked ? (
          <div className="border border-[#ded8ce] bg-white px-5 py-6 space-y-3">
            <p className="text-[0.9rem] leading-relaxed text-[#1b1713]/70">
              Owner session required. This room is not for visitors.
            </p>
            <p className="font-mono text-[0.62rem] leading-6 text-[#1b1713]/50 break-all">
              /api/auth/owner?key=YOUR_OWNER_KEY&amp;next=/council
            </p>
          </div>
        ) : (
          <CouncilChat />
        )}
      </div>
    </main>
  );
}
