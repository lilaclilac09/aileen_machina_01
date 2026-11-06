import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OKC Explorer',
  description:
    'Where time goes in the Muse kernel pipeline — Copy, Compute, Wait, Launch — with measured okc checks vs SGLang on H200.',
  alternates: { canonical: '/nsight' },
};

/** Full-bleed static explorer (public/nsight.html). */
export default function NsightPage() {
  return (
    <div
      data-testid="nsight-frame"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#f6f7f9',
      }}
    >
      <iframe
        src="/nsight.html"
        title="OKC Explorer"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}
