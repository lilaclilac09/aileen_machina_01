/**
 * Magazine-rack data for the Huawei / HBM pilot.
 *
 * Structure (per Aileen's editorial-rack spec):
 *  - cover: scene + title + core question
 *  - columns: 7 fixed columns (Cover Story / Data / On the Ground /
 *    People / Counter / Archive / Verdict)
 *  - cards: each card has title, scene, judgment (one sentence),
 *    points (3 bullets), impact tag (reinforces | weakens | uncertain)
 *  - verdict: editor's take (stance, confidence, reasons, counter,
 *    indicators)
 *
 * Numbers preserved exactly from /blog/huawei-hbm + /blog/huawei-supply.
 */

export type ImpactDirection = 'reinforces' | 'weakens' | 'uncertain';
export type Stance = 'bullish' | 'bearish' | 'wait';
export type Confidence = 'high' | 'medium' | 'low';

export type MagazineCard = {
  id: string;
  title: string;
  scene: string;
  judgment: string;
  points: string[];
  impact: ImpactDirection;
  impactNote: string;
  drawer?: {
    sources?: string[];
    quotes?: { who: string; text: string }[];
    math?: string;
  };
};

export type MagazineColumn = {
  id: string;
  label: string;
  tagline: string;
  cards: MagazineCard[];
};

export type Verdict = {
  stance: Stance;
  stanceText: string;
  confidence: Confidence;
  confidenceNote: string;
  reasons: string[];
  biggestCounter: string;
  indicators: string[];
  timeWindow: string;
};

export type MagazineIssue = {
  slug: string;
  issueNumber: string;
  coverScene: string;
  coverTitle: string;
  coverQuestion: string;
  columns: MagazineColumn[];
  verdict: Verdict;
};

export const HUAWEI_HBM: MagazineIssue = {
  slug: 'huawei-hbm',
  issueNumber: 'Issue 01',
  coverScene:
    'December 2024. In the one-month window between when the export restriction is announced and when it takes effect, 7 million HBM stacks land in China. Inside Huawei, the next chip already has a codename: David. Goliath is across the table — and not standing still.',
  coverTitle: "David's Stockpile",
  coverQuestion:
    'Is Huawei betting on system architecture, or on a stockpile holding until CXMT ramps?',

  columns: [
    /* ── 1. COVER STORY — the editorial thesis ────────────────────────── */
    {
      id: 'cover-story',
      label: 'Cover Story',
      tagline: 'The thesis behind the issue',
      cards: [
        {
          id: 'thesis',
          title: 'The system fight is won',
          scene: '8,192 cards behaving like one machine',
          judgment:
            'Huawei has already won the system-engineering fight. The remaining variable is HBM supply.',
          points: [
            '8,192 Ascend NPUs stitched into a 1,152 TB unified-address pool',
            'Fabric bandwidth 16.3 PB/s — 62× the industry average',
            'Round-trip time 7 μs → 3 μs',
          ],
          impact: 'reinforces',
          impactNote: 'Strongest pro for the bullish stance',
          drawer: {
            sources: [
              'Xu Zhijun, Huawei Connect 2025 keynote',
              'SemiAnalysis, Huawei AI CloudMatrix 384 (2025-04)',
            ],
          },
        },
        {
          id: 'software-flip',
          title: 'The software fight flipped half-way',
          scene: 'DeepSeek V4 launches on two stacks only — CUDA and CANN',
          judgment:
            'The ecosystem-gap argument has been weakened by one data point: Day-0 DeepSeek V4 on Ascend.',
          points: [
            'Of every software stack on the planet, only CUDA + CANN had Day-0 support',
            "AMD's ROCm did not get there on launch day",
            'Part of DeepSeek’s official API runs on Huawei from day one',
          ],
          impact: 'reinforces',
          impactNote: 'Closes the ecosystem-moat objection',
          drawer: {
            sources: [
              'SemiAnalysis, DeepSeek V4 1.6T Day 0 to Day 43 (2026-06)',
              'gitcode.com/cann/cann-recipes-infer',
            ],
          },
        },
        {
          id: 'real-bet',
          title: 'The real bet is one input Huawei does not control',
          scene: 'A countdown clock, ticking down one HBM stack at a time',
          judgment:
            'The bet is not on UnifiedBus. It is on the CXMT line in Hefei against the day the stockpile hits zero — and which one gets there first.',
          points: [
            'System architecture: "can it be designed?" Won.',
            'HBM: "can it be built?" Locked in someone else’s hands.',
            'Two curves decide 2026–2027: CXMT yield ramp + stockpile burn-down',
          ],
          impact: 'uncertain',
          impactNote: 'Frames the asymmetric risk',
        },
      ],
    },

    /* ── 2. DATA — the receipts ───────────────────────────────────────── */
    {
      id: 'data',
      label: 'Data',
      tagline: 'The numbers that decide it',
      cards: [
        {
          id: 'superpod',
          title: 'SuperPoD vs NVL144 — like-for-like and not',
          scene: '~160 cabinets, 8,192 cards, one address space',
          judgment:
            'On the dimension that trillion-parameter training is most sensitive to (largest single coherent SuperPoD), Huawei is first.',
          points: [
            'vs NVL144: 56.8× cards, 6.7× compute, 15× memory, 62× interconnect',
            'Caveat: 6.7× = ~160-cabinet array vs single 144-card cabinet',
            'NVIDIA SuperPods also scale; per-card Huawei is still behind',
          ],
          impact: 'reinforces',
          impactNote: 'System advantage, but read the caveat',
        },
        {
          id: 'hbm-counts',
          title: 'The HBM ledger',
          scene: 'A spreadsheet that decides production volume',
          judgment:
            'Foreign HBM stockpile is enough for ~1.6M Ascend 910Cs, burning down by year-end.',
          points: [
            'Samsung shipped 11.4M stacks to China; 7M in the one-month Dec-2024 window',
            'CoAsia / Faraday smuggling channel adds to ~13M total stacks',
            'CXMT next year: ~2M stacks = enough for 250–300K 910Cs',
          ],
          impact: 'weakens',
          impactNote: 'Quantifies the production ceiling',
          drawer: {
            math:
              '~13M stacks ÷ 8 stacks per 910C ≈ 1.6M cards. 2M CXMT stacks ÷ 8 ≈ 250K cards.',
            sources: [
              'SemiAnalysis, Huawei Ascend Production Ramp (2025-09)',
            ],
          },
        },
        {
          id: 'pairing-gap',
          title: '300K vs 5M+ — the HBM-bound gap',
          scene: 'Die banks at SMIC waiting for HBM that does not exist',
          judgment:
            "It isn't the logic that can't be made — it's that there's no memory to pair it with.",
          points: [
            'SMIC can fab ~1M 910C dies + 500K 910B dies/year',
            'If HBM pairing were unconstrained: 300K → 5M+ Ascend units',
            'GDDR / LPDDR fallback cannot sustain frontier-model training',
          ],
          impact: 'weakens',
          impactNote: 'The 16× gap is entirely memory-bound',
        },
      ],
    },

    /* ── 3. ON THE GROUND — concrete situations ───────────────────────── */
    {
      id: 'ground',
      label: 'On the Ground',
      tagline: 'What’s actually happening in the field',
      cards: [
        {
          id: 'one-month-window',
          title: 'The one-month window in December 2024',
          scene: 'Cargo planes between Seoul and Shenzhen, every other day',
          judgment:
            'The restriction was pre-announced months early, which acted as a buffer.',
          points: [
            '7M HBM stacks shipped to China in 4 weeks',
            'The same window Samsung quietly converted backlog to early delivery',
            'Whole-year shipments to China hit 11.4M stacks',
          ],
          impact: 'weakens',
          impactNote: 'Stockpile is finite and one-off',
        },
        {
          id: 'smuggling-channel',
          title: 'CoAsia, Faraday, low-temperature solder',
          scene: 'HBM arrives inside "non-functional" chip packages, decapped on landing',
          judgment:
            'The smuggling route was a real volume contributor — until it was named publicly.',
          points: [
            "Technically compliant if the package didn’t exceed the FLOPS red line",
            'Low-temperature solder joints made decap easier domestically',
            'Channel reportedly shut down after public exposure',
          ],
          impact: 'weakens',
          impactNote: 'The unofficial stream is closing',
        },
        {
          id: 'day-zero-cann',
          title: "DeepSeek V4 Day 0 on CANN",
          scene: 'Two software stacks. Two only.',
          judgment:
            'Whatever the story was about CANN at end-2025, it changed materially in mid-2026.',
          points: [
            'CUDA + CANN were the only Day-0 stacks',
            'A year earlier, only CUDA hit Day-0 for V3 / R1',
            'Part of DeepSeek’s official API runs on Huawei',
          ],
          impact: 'reinforces',
          impactNote: 'The ecosystem moat is no longer one-vendor',
        },
      ],
    },

    /* ── 4. PEOPLE — the voices and positions ─────────────────────────── */
    {
      id: 'people',
      label: 'People',
      tagline: 'Who is saying what, and why',
      cards: [
        {
          id: 'xu-zhijun',
          title: 'Xu Zhijun at Huawei Connect 2025',
          scene: 'The keynote where Huawei drops the 56.8× / 6.7× / 15× / 62× slide',
          judgment:
            'Huawei chose to lead the disclosure on system multiples, not per-card multiples — because that’s where they win.',
          points: [
            '8,192 cards / 1,152 TB / 16.3 PB/s announced from the stage',
            'MWC Barcelona 2026 was the overseas reprise',
            'The reframing of "scale-up" vs "per-card" is deliberate',
          ],
          impact: 'reinforces',
          impactNote: 'Read the narrative choice as a signal',
        },
        {
          id: 'semianalysis',
          title: "SemiAnalysis: 'system over microarch'",
          scene: 'Dylan Patel concedes the system architecture is a generation ahead',
          judgment:
            'Even the toughest neutral observer agrees the bottleneck is HBM — not silicon.',
          points: [
            'Chip is one process generation behind, system architecture one generation ahead',
            "Three reports build the production-math case",
            "300K → 5M+ unit gap depends entirely on HBM, not lithography or SMIC yield",
          ],
          impact: 'reinforces',
          impactNote: 'Independent corroboration of the thesis',
        },
        {
          id: 'beijing-asks',
          title: 'What Beijing asks for at the table',
          scene: 'Negotiation positions are a signal — read what they ask for, not what they say',
          judgment:
            'Beijing has specifically asked for looser HBM controls — not TSMC capacity, not EUV equipment.',
          points: [
            'The detail of what gets asked for is its own signal',
            'No request for lithography or fab capacity relief',
            'HBM is the single explicit ask',
          ],
          impact: 'reinforces',
          impactNote: 'China itself agrees on the choke point',
        },
        {
          id: 'big-fund-cxmt',
          title: 'CXMT and the Big Fund Phase 3',
          scene: 'A $2 billion check from the Big Fund Phase 3 to CXMT in May 2024',
          judgment:
            'Capital is not the constraint. Time is.',
          points: [
            'CXMT trails leaders by 1–2 years on standard DRAM',
            'On HBM the gap is another order of magnitude',
            'Best-case 2026: ~2M HBM stacks = 250–300K Ascend',
          ],
          impact: 'uncertain',
          impactNote: 'Capital flowing in does not buy yield-curve years',
        },
      ],
    },

    /* ── 5. COUNTER-ARGUMENT — what bears miss, and where they’re right ── */
    {
      id: 'counter',
      label: 'Counter-Argument',
      tagline: 'The bear case, taken seriously',
      cards: [
        {
          id: 'process-gap',
          title: "The chip is genuinely a node behind",
          scene: 'A wafer that costs more and yields less per die than the comparable NVIDIA part',
          judgment: 'On per-card terms, Huawei loses — and the gap is real, not optical.',
          points: [
            'Roughly 1/3 the per-card throughput of NVIDIA same-window NVL144',
            'TSMC lock through CoWoS + CPO is the bedrock NVIDIA owns',
            'System workaround only matters at SuperPoD scale, not single-card workloads',
          ],
          impact: 'weakens',
          impactNote: 'Strongest piece of the bear case',
        },
        {
          id: 'ecosystem-tail',
          title: 'CUDA still has 18 years of head start',
          scene: 'A long-tail dependency on libraries, kernels, papers, hires',
          judgment:
            'Day-0 DeepSeek closes the headline gap, but the long tail of CUDA’s ecosystem is unsolved.',
          points: [
            'Most production AI shops remain CUDA-default',
            'Migration cost above the latest model is high',
            'CANN open-source contributors skew Huawei-internal',
          ],
          impact: 'weakens',
          impactNote: 'Day-0 ≠ ecosystem parity',
        },
        {
          id: 'bull-trap',
          title: 'If CXMT ramps faster than expected, the bear case collapses',
          scene: 'A counter-counter — the case for the bear case being wrong',
          judgment:
            'The whole HBM-bottleneck thesis collapses if CXMT moves from 2M to 5M+ stacks within 18 months.',
          points: [
            'Big Fund Phase 3 cash is materially larger than analysts assume',
            'Talent poaching from Samsung / SK Hynix / Micron is accelerating',
            'DDR5 ramp shows CXMT can move on standard memory; HBM is the open question',
          ],
          impact: 'uncertain',
          impactNote: 'This is the asymmetry the bull side hopes for',
        },
      ],
    },

    /* ── 6. ARCHIVE — sources, repos, primary material ───────────────── */
    {
      id: 'archive',
      label: 'Archive',
      tagline: 'Where the receipts live',
      cards: [
        {
          id: 'semianalysis-trilogy',
          title: 'SemiAnalysis trilogy',
          scene: 'Three reports across 14 months that build the case',
          judgment:
            'The system-architecture / production-math / Day-0 trio is the empirical spine of this issue.',
          points: [
            'CloudMatrix 384 — China’s Answer to GB200 NVL72 (2025-04)',
            'Ascend Production Ramp — Die Banks, TSMC, HBM Bottleneck (2025-09)',
            'DeepSeek V4 Day 0 to Day 43 (2026-06)',
          ],
          impact: 'reinforces',
          impactNote: 'Primary source for nearly every number',
        },
        {
          id: 'huawei-disclosures',
          title: 'Huawei official disclosures',
          scene: 'Stage slides + speaker notes',
          judgment:
            "The system multiples (56.8× / 6.7× / 15× / 62×) come directly from Xu Zhijun's keynote, not from analyst estimates.",
          points: [
            'Huawei Connect 2025 — primary disclosure',
            'MWC Barcelona 2026 — overseas debut',
            "Slide deck wording matters: 'scale-up' is the operative term",
          ],
          impact: 'reinforces',
          impactNote: 'Receipts for the system claims',
        },
        {
          id: 'repos',
          title: 'Technical repos',
          scene: 'Open-source code lets you check the Day-0 claim yourself',
          judgment:
            "CANN being open is the single biggest test of 'real ecosystem or Huawei-only?'",
          points: [
            'gitcode.com/cann/community — CANN OSS hub',
            'gitcode.com/cann/cann-recipes-infer — DeepSeek V4 Ascend recipe',
            'github.com/sgl-project/sglang#23600 + github.com/vllm-project/vllm#40902',
          ],
          impact: 'reinforces',
          impactNote: 'Independently verifiable',
        },
      ],
    },
  ],

  verdict: {
    stance: 'wait',
    stanceText:
      'Bullish on Huawei’s system advantage. Bearish on production volume next year. The two pull in opposite directions — verdict is wait-and-watch on the HBM curves.',
    confidence: 'high',
    confidenceNote: 'High on the diagnosis (HBM is the bottleneck). Medium on the timing.',
    reasons: [
      'System fight is won (8,192-card SuperPoD with unified addressing, 62× the industry-average interconnect)',
      'Software story flipped half-way (Day-0 DeepSeek V4 on CANN — only CUDA + CANN, no ROCm)',
      'HBM is the precise blocker — not lithography, not SMIC yield, not capital',
    ],
    biggestCounter:
      'If CXMT yields ramp faster than expected (Big Fund Phase 3 cash + Korean talent poaching is materially under-modeled), the entire bottleneck thesis compresses on a 12–18 month horizon.',
    indicators: [
      'CXMT HBM yield, monthly — the single most-leveraged variable',
      'Foreign HBM stockpile depletion — track the burn rate, the smuggling-route status, and any leakage signals',
      'New CANN Day-0 launches — a second Day-0 model after DeepSeek V4 would confirm the software thesis is structural, not one-off',
    ],
    timeWindow: '12–18 months — the window where both curves resolve',
  },
};
