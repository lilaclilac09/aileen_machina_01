import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OKC Explorer',
  description:
    'Where time goes in the Muse kernel pipeline — floor vs gap first, then Copy / Compute / Wait / Launch methods on the hot slice.',
  alternates: { canonical: '/nsight' },
};

const VIEWS = new Set(['overview', 'diagnose', 'bf16', 'attn', 'moe', 'declayer', 'prelayer']);

/** Full-bleed static explorer (public/nsight.html). */
export default async function NsightPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const src = view && VIEWS.has(view) ? `/nsight.html?view=${encodeURIComponent(view)}` : '/nsight.html';
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
        src={src}
        title="OKC Explorer"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}
