import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metal & Pages',
  description:
    'Book club and visual shelf: Didion, Churchill, systems reading, and notes on what is open on the desk.',
  alternates: { canonical: '/updates' },
};

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
