import type { Metadata } from 'next';
import AudioClippingProductPage from '../../components/tools/AudioClippingProductPage';
import '../../components/tools/arcade.css';

export const metadata: Metadata = {
  title: 'Audio Clipping — Aileena',
  description:
    'Long-form YouTube to short clips. Free local silence-gap mode — no Inkling / Together API key required. Optional Inkling when you have a key.',
};

export default function AudioClippingPage() {
  return <AudioClippingProductPage />;
}
