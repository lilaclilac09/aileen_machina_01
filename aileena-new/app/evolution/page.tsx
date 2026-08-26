import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Proof queue · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/** Alias — preferred route is /proof. */
export default function EvolutionRedirect() {
  redirect('/proof');
}
