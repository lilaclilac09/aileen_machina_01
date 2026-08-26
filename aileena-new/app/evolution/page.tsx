import type { Metadata } from 'next';
import Link from 'next/link';
import { getOwnerIdentity } from '@/lib/owner-gate';
import OwnerUnlockForm from '@/components/OwnerUnlockForm';
import ProofQueuePanel from '@/components/ProofQueuePanel';
import { ensureDailyOwnerKeySeed, listProofQueue, proofQueueWritesOk } from '@/lib/proofQueueStore';

export const metadata: Metadata = {
  title: 'Proof queue · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Owner-only proof queue. Site mutations wait for screenshots + Aileen's yes.
 * Does not merge. Does not deploy.
 */
export default async function EvolutionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const owner = await getOwnerIdentity();
  const locked = !owner;
  const denied = (await searchParams).error === 'denied';
  const queue =
    !locked && proofQueueWritesOk()
      ? await (async () => {
          await ensureDailyOwnerKeySeed();
          return listProofQueue();
        })()
      : !locked
        ? await listProofQueue()
        : null;

  return (
    <main className="mobile-page min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14 pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+2.5rem))] w-full min-w-0 box-border">
        <header className="mb-8 space-y-2">
          <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
            owner · proof queue
          </p>
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight text-[#1b1713]">
            proof queue
          </h1>
          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
            Observe, propose, wait. Change is allowed — merge is not, until you
            say yes and the screenshots exist. No auto-deploy.
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] uppercase text-[#1b1713]/40">
            no owner approval = no merge
          </p>
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
        </header>

        {locked ? (
          <div className="border border-[#ded8ce] bg-white px-5 py-6 space-y-4 max-w-xl">
            <p className="text-[0.9rem] leading-relaxed text-[#1b1713]/70">
              ⚡ Owner only. Same key as cabinet.
            </p>
            <OwnerUnlockForm next="/evolution" enterLabel="enter proof queue" denied={denied} />
          </div>
        ) : (
          <ProofQueuePanel
            initialProposals={queue?.proposals ?? []}
            initialPersistence={queue?.persistence ?? 'memory'}
          />
        )}
      </div>
    </main>
  );
}
