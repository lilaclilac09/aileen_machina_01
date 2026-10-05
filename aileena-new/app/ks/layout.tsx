import type { Metadata } from 'next';
import { KS_APP_HOST, KS_APP_URL } from '@/lib/keyshield/constants';
import './ks.css';

export const metadata: Metadata = {
  title: 'KeyShield — encrypted secret vault',
  description:
    'Passkey PRF → HKDF → AES-256-GCM. Server stores ciphertext only. Live at app.ks.aileena.xyz.',
  alternates: { canonical: KS_APP_URL },
};

export default function KsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-ks-app data-ks-host={KS_APP_HOST}>
      {children}
    </div>
  );
}
