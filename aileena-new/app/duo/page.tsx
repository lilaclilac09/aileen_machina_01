import type { Metadata } from 'next';
import DuoLabClient from '../../components/DuoLabClient';
import './duo-lab.css';

export const metadata: Metadata = {
  title: 'Duo lab · AILEENA',
  description: 'iPhone Duo / iOS web foldable API lab — cover, inner, tent.',
  robots: { index: false, follow: false },
};

export default function DuoLabPage() {
  return <DuoLabClient />;
}
