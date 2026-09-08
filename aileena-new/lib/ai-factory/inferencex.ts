import type { EvidenceLevel } from './rack-facts';

/** SemiAnalysis InferenceX Official Preview — public lede, 7 Sep 2026. Paid remainder stays out. */
export const INFERENCEX_HREF = 'https://newsletter.semianalysis.com/p/tpu-inferencex-full-steam';

export const INFERENCEX = {
  href: INFERENCEX_HREF,
  outlet: 'SemiAnalysis',
  title: 'TPU Inference Externalization Full Steam Ahead - InferenceX',
  date: '2026-09-07',
  authors: 'Alec Ibarra, Cam Quilici, Bryan Shan et al.',
  paid: true,
  model: 'Qwen3.5 397B FP8',
  at20ToksPerUser: { ironwood: 9364, b200: 8903, b300: 8925 },
  tokensPerDollarVsB200Pct: 50.4,
  usdPerMTokAt100: { ironwood: 0.181, b200: 0.222, b300: 0.276 },
  torchTpuOss: 'mid-October 2026, PyTorch Conference',
  level: 'source-backed' as EvidenceLevel,
};
