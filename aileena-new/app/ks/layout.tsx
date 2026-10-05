import type { Metadata } from 'next';
import { KS_APP_HOST, KS_APP_URL } from '@/lib/keyshield/constants';
import './ks.css';

export const metadata: Metadata = {
  title: 'KeyShield — Zero-Trust API Key Vault',
  description:
    'Connect a Solana wallet or passkey. AES-256-GCM on device. Server stores ciphertext only.',
  alternates: { canonical: KS_APP_URL },
};

export default function KsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-ks-app data-ks-host={KS_APP_HOST}>
      {children}
    </div>
  );
}
