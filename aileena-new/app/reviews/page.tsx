import type { Metadata } from 'next';
import Link from 'next/link';
import { getOwnerIdentity } from '@/lib/owner-gate';
import OwnerUnlockForm from '@/components/OwnerUnlockForm';
import JevDashboard from '@/components/reviews/JevDashboard';

export const metadata: Metadata = {
  title: 'Jev review · AILEENA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const owner = await getOwnerIdentity();
  const params = await searchParams;
  const denied = params.error === 'denied';

  if (!owner) {
    return (
      <main className="mobile-page min-h-[100dvh] bg-[#fbfaf7] text-[#1b1713] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14 pt-[max(2.5rem,calc(env(safe-area-inset-top,0px)+2.5rem))] w-full min-w-0 box-border">
          <header className="mb-8 space-y-2">
            <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
              owner · keyshield door
            </p>
            <h1 className="font-serif text-[1.85rem] sm:text-[2.15rem] tracking-tight text-[#1b1713]">
              Reviews stay in this room
            </h1>
            <p className="max-w-2xl text-[0.88rem] leading-relaxed text-[#1b1713]/55">
              Code review reports are not on the public site. Unlock with KeyShield on this device, or the admin password.
            </p>
            <p className="font-mono text-[0.55rem] tracking-[0.14em] text-[#1b1713]/35">
              <Link href="/" className="hover:text-[#008f86]">
                ← home
              </Link>
            </p>
          </header>
          <div className="border border-[#ded8ce] bg-white px-5 py-6">
            <OwnerUnlockForm next="/reviews" enterLabel="unlock" denied={denied} />
            <form action="/api/auth/owner" method="post" className="mt-6 space-y-2 border-t border-[#ded8ce] pt-5" data-testid="reviews-admin-password">
              <p className="font-mono text-[0.55rem] tracking-[0.22em] uppercase text-[#008f86]/85">admin password</p>
              <input type="hidden" name="next" value="/reviews" />
              <input
                type="password"
                name="key"
                autoComplete="current-password"
                required
                aria-label="Admin password"
                className="block w-full max-w-xs border border-[#ded8ce] bg-[#fbfaf7] px-3 py-2 text-[0.85rem] text-[#1b1713] outline-none focus:border-[#00a89d]"
              />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center font-mono text-[0.62rem] tracking-[0.22em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-4 py-2 hover:bg-[#e9fffc]"
              >
                unlock with password
              </button>
              {denied ? <p className="text-[0.8rem] text-[#1b1713]/55">That password did not open the door.</p> : null}
            </form>
          </div>
        </div>
      </main>
    );
  }

  return <JevDashboard />;
}
