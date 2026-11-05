import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open Kernel Challenge',
  description:
    'Increase bandwidth, reduce latency. Nsight Systems–style map of Muse kernels — system + GPU + NVTX together, so you see what warps wait on, not just GFLOPS.',
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
        title="Open Kernel Challenge"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}
