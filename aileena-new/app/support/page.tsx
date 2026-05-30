import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DONATE_ENABLED } from '../../lib/donate';
import Donate from '../../components/Donate';

export const metadata: Metadata = {
  title: 'Support · AILEENA MACHINA',
  robots: { index: false, follow: false },
};

/**
 * Donation page. Hidden until NEXT_PUBLIC_DONATE_ENABLED === '1' — so the
 * whole flow ships "built but not released". Until then it 404s.
 */
export default function SupportPage() {
  if (!DONATE_ENABLED) notFound();
  return <Donate />;
}
