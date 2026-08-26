import type { Metadata } from 'next';
import Link from 'next/link';
import { getOwnerIdentity } from '@/lib/owner-gate';
import OwnerCornerUnlock from '@/components/OwnerCornerUnlock';
import ProofQueuePanel from '@/components/ProofQueuePanel';
import { ensureProofQueueSeeds, listProofQueue, proofQueueWritesOk } from '@/lib/proofQueueStore';

export const metadata: Metadata = {
  title: 'Proof queue · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Owner-only proof queue. Mutations wait for screenshots + Aileen's yes.
 * Does not merge. Does not deploy.
 */
export default async function ProofPage() {
  const owner = await getOwnerIdentity();
  const locked = !owner;
  const queue =
    !locked && proofQueueWritesOk()
      ? await (async () => {
          await ensureProofQueueSeeds();
          return listProofQueue();
        })()
      : !locked
        ? await listProofQueue()
        : null;

  return (
    <main className="mobile-page min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14 pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+2.5rem))] w-full min-w-0 box-border">
        <header className="mb-8 space-y-2">
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight text-[#1b1713]">
            proof queue
          </h1>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] uppercase text-[#1b1713]/40">
            no owner approval = no merge
          </p>
          {locked ? null : (
            <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
              <Link href="/cabinet" className="hover:text-[#008f86]">
                ← cabinet
              </Link>
              <span className="mx-2">·</span>
              <Link href="/council" className="hover:text-[#008f86]">
                council
              </Link>
              <span className="mx-2">·</span>
              <Link href="/" className="hover:text-[#008f86]">
                home
              </Link>
            </p>
          )}
        </header>

        {locked ? (
          <p data-testid="proof-owner-only" className="text-[0.95rem] text-[#1b1713]/70">
            ⚡ Owner only.
          </p>
        ) : (
          <ProofQueuePanel
            initialProposals={queue?.proposals ?? []}
            initialPersistence={queue?.persistence ?? 'memory'}
          />
        )}
      </div>
      {locked ? <OwnerCornerUnlock /> : null}
    </main>
  );
}
