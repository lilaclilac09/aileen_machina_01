import type { Metadata } from 'next';
import TamperCheckLab from '../../../components/tools/TamperCheckLab';

export const metadata: Metadata = {
  title: 'Tamper Check · weigh your Ledger before you trust it',
  description: 'Interactive mg-scale lab: weigh a Ledger three times, then find its center of mass with two scales and a ruler. Runs entirely in your browser.',
};

export default function TamperCheckPage() {
  // html/body are overflow:hidden site-wide (globals.css); this page owns its scroll container.
  return (
    <div data-testid="tc-scroll" style={{ position: 'fixed', inset: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', background: '#f6f5f2' }}>
      <TamperCheckLab />
    </div>
  );
}
