import type { Metadata } from 'next';
import { t } from '../../lib/translations';

export const metadata: Metadata = { title: t.EN.works.heading, description: t.EN.works.body };

export default function WorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
