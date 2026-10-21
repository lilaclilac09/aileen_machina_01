import type { Metadata } from 'next';
import { t } from '../../lib/translations';

export const metadata: Metadata = { title: t.EN.sound.heading, description: t.EN.sound.body };

export default function SoundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
