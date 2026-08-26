import type { Metadata } from 'next';
import Link from 'next/link';
import { getOwnerIdentity } from '@/lib/owner-gate';
import OwnerUnlockForm from '@/components/OwnerUnlockForm';
import ProofQueuePanel from '@/components/ProofQueuePanel';
import { isComputerPrototypeEnabled, isLocalExperimentUnlockAllowed } from '@/lib/computer/flag';

export const metadata: Metadata = {
  title: 'Proof queue · AILEENA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProofPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; experiment?: string }>;
}) {
  const owner = await getOwnerIdentity();
  const params = await searchParams;
  const denied = params.error === 'denied';
  const experiment = params.experiment === '1';
  const enabled = isComputerPrototypeEnabled();
  const localUnlock = isLocalExperimentUnlockAllowed();

  return (
    <main className="mobile-page min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14 pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+2.5rem))] w-full min-w-0 box-border">
        <header className="mb-8 space-y-2">
          <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
            owner · proof queue · prototype
          </p>
          <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight text-[#1b1713]">
            computer
          </h1>
          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
            Background worker for repo-aware plans. The site agent stays fast.
            Merge stays owner-only. Not production.
          </p>
          <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
            <Link href="/" className="hover:text-[#008f86]">
              ← home
            </Link>
            <span className="mx-2">·</span>
            <Link href="/council" className="hover:text-[#008f86]">
              council
            </Link>
            <span className="mx-2">·</span>
            <Link href="/daily" className="hover:text-[#008f86]">
              daily
            </Link>
          </p>
        </header>

        {!enabled ? (
          <p className="text-[0.9rem] text-[#1b1713]/60">
            Prototype is off here (production or COMPUTER_PROTOTYPE=0).
          </p>
        ) : !owner ? (
          <div className="border border-[#ded8ce] bg-white px-5 py-6 space-y-4">
            <p className="text-[0.9rem] leading-relaxed text-[#1b1713]/70">
              This room is not for visitors. Enter with the owner key.
            </p>
            <OwnerUnlockForm next="/proof" enterLabel="enter proof" denied={denied} />
            {localUnlock ? (
              <form action="/api/auth/owner/experiment" method="post" className="pt-2 border-t border-[#ded8ce]">
                <p className="mb-3 font-mono text-[0.55rem] tracking-[0.18em] uppercase text-[#c46b2e]">
                  local experiment{experiment ? ' · on' : ''}
                </p>
                <p className="mb-3 text-[0.8rem] leading-relaxed text-[#1b1713]/55">
                  Localhost only. Does not use the production owner key. Does not merge.
                  Does not enable Cloudflare Computer.
                </p>
                <button
                  type="submit"
                  data-testid="proof-experiment-enter"
                  className="inline-flex min-h-11 items-center font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-4 py-2 hover:bg-[#e9fffc]"
                >
                  enter local experiment
                </button>
              </form>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mb-4 font-mono text-[0.55rem] tracking-[0.18em] uppercase text-[#c46b2e]">
              experiment mode · local shim · no merge
            </p>
            <ProofQueuePanel />
          </>
        )}
      </div>
    </main>
  );
}
