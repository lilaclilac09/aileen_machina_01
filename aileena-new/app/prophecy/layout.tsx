import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prophecy Hall',
  description:
    'A shelf of misted glass spheres. Warm one that is yours — the words stream into the Console, not the ball.',
  alternates: { canonical: '/prophecy' },
};

export default function ProphecyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
