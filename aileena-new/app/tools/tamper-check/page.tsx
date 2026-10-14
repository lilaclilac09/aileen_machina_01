import type { Metadata } from 'next';
import TamperCheckLab from '../../../components/tools/TamperCheckLab';

export const metadata: Metadata = {
  title: 'Tamper Check · weigh your Ledger before you trust it',
  description: 'Interactive mg-scale lab: weigh a Ledger three times, then find its center of mass with two scales and a ruler. Runs entirely in your browser.',
};

export default function TamperCheckPage() {
  return <TamperCheckLab />;
}
