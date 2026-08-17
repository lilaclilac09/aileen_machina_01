import type { Metadata } from 'next';
import Link from 'next/link';
import { getOwnerIdentity } from '@/lib/owner-gate';
import CouncilChat from '@/components/CouncilChat';
import OwnerUnlockForm from '@/components/OwnerUnlockForm';

export const metadata: Metadata = {
  title: 'Council · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Private council — owner only. Session-only: transcripts are not persisted.
 * Door: this page. Cabinet of visitor notes: /cabinet.
 */
export default async function CouncilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const owner = await getOwnerIdentity();
  const locked = !owner;
  const denied = (await searchParams).error === 'denied';

  return (
    <main className="mobile-page min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14 pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+2.5rem))] w-full min-w-0 box-border">
        <header className="mb-8 space-y-2">
          <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
            owner · private council
          </p>
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight text-[#1b1713]">
            aileena council
          </h1>
          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
            Private staff, not a comfort bot. Sharp, dry, not persuadable.
            Splits emotion from money, scope, and power. Protects leverage
            and time.
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] uppercase text-[#1b1713]/40">
            private mode · no public transcript · no leave-a-note
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
            <Link href="/" className="hover:text-[#008f86]">
              ← home
            </Link>
            <span className="mx-2">·</span>
            <Link href="/cabinet" className="hover:text-[#008f86]">
              cabinet
            </Link>
          </p>
        </header>

        {locked ? (
          <div className="border border-[#ded8ce] bg-white px-5 py-6 space-y-4">
            <p className="text-[0.9rem] leading-relaxed text-[#1b1713]/70">
              This room is not for visitors. Enter with the owner key, then the
              cabinet is one step away.
            </p>
            <OwnerUnlockForm next="/council" enterLabel="enter council" denied={denied} />
          </div>
        ) : (
          <CouncilChat />
        )}
      </div>
    </main>
  );
}
