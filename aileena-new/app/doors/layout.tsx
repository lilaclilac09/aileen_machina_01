import type { Metadata } from 'next';
import { t } from '../../lib/translations';

export const metadata: Metadata = {
  title: 'Doors',
  description: t.EN.watchHub.body,
  alternates: { canonical: '/doors' },
};

export default function DoorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
