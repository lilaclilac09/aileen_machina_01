/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';

export const metadata = {
  title: 'aileena.xyz · Data API',
  description:
    'Public HTTP API for chip specs, pricing, news, earnings transcripts, and analyst research that Aileen tracks.',
};

type Param = { name: string; required?: boolean; type: string; doc: string };
type Endpoint = {
  method: 'GET' | 'POST';
  path: string;
  doc: string;
  params?: Param[];
  body?: { schema: string; doc: string };
  example: string;
};

const ENDPOINTS: { group: string; items: Endpoint[] }[] = [
  {
    group: 'Health',
    items: [
      {
        method: 'GET',
        path: '/api/v1/health',
        doc: 'Service status + dataset counts (number of SKUs, news items, doc chunks).',
        example: 'curl https://aileena.xyz/api/v1/health',
      },
    ],
  },
  {
    group: 'Chips · accelerators · memory',
    items: [
      {
        method: 'GET',
        path: '/api/v1/chips',
        doc: 'List SKUs in the catalogue, optionally filtered.',
        params: [
          { name: 'vendor', type: 'string', doc: 'nvidia | amd | intel | google | aws | meta | broadcom | …' },
          { name: 'category', type: 'string', doc: 'gpu | cpu | accelerator | memory | interconnect | …' },
          { name: 'family', type: 'string', doc: 'partial match against architecture family' },
          { name: 'limit', type: 'integer', doc: 'max 100, default 50' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/chips?vendor=nvidia&category=gpu&limit=10'",
      },
      {
        method: 'GET',
        path: '/api/v1/chips/{name}',
        doc: 'Best fuzzy match for a single SKU. Returns full spec row (vendor, family, process, FLOPS, memory, TDP, MSRP, status, sources).',
        params: [{ name: 'name', type: 'string', required: true, doc: 'URL-encoded SKU name (full or partial)' }],
        example: 'curl https://aileena.xyz/api/v1/chips/H100',
      },
      {
        method: 'GET',
        path: '/api/v1/chips/compare',
        doc: 'Side-by-side comparison of two SKUs.',
        params: [
          { name: 'a', type: 'string', required: true, doc: 'SKU A' },
          { name: 'b', type: 'string', required: true, doc: 'SKU B' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/chips/compare?a=H100&b=MI300X'",
      },
    ],
  },
  {
    group: 'Pricing',
    items: [
      {
        method: 'GET',
        path: '/api/v1/pricing/{sku}/latest',
        doc: 'Most recent observed price for an SKU.',
        params: [
          { name: 'sku', type: 'string', required: true, doc: 'SKU name (substring match)' },
          { name: 'unit', type: 'string', doc: 'per_chip | per_card | per_server | per_hour_cloud | per_month_cloud' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/pricing/H100/latest?unit=per_chip'",
      },
      {
        method: 'GET',
        path: '/api/v1/pricing/{sku}',
        doc: 'Full chronological price history for an SKU, optionally within a date range.',
        params: [
          { name: 'sku', type: 'string', required: true, doc: 'SKU name (substring match)' },
          { name: 'from', type: 'string', doc: 'inclusive start date, YYYY-MM-DD' },
          { name: 'to', type: 'string', doc: 'inclusive end date, YYYY-MM-DD' },
          { name: 'unit', type: 'string', doc: 'see /latest' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/pricing/H100?from=2024-01-01&to=2025-01-01'",
      },
    ],
  },
  {
    group: 'News / tracking',
    items: [
      {
        method: 'GET',
        path: '/api/v1/news',
        doc: 'Recent tracking items in reverse-chronological order.',
        params: [
          { name: 'vendor', type: 'string', doc: 'filter by vendor (one of the VendorEnum values)' },
          { name: 'since', type: 'string', doc: 'YYYY-MM-DD, inclusive' },
          { name: 'limit', type: 'integer', doc: 'max 50, default 10' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/news?vendor=nvidia&limit=5'",
      },
      {
        method: 'GET',
        path: '/api/v1/news/search',
        doc: 'TF-IDF free-text search over news titles + summaries + topics.',
        params: [
          { name: 'q', type: 'string', required: true, doc: 'query (≥2 chars)' },
          { name: 'k', type: 'integer', doc: 'max 20, default 5' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/news/search?q=HBM3E+supply&k=5'",
      },
    ],
  },
  {
    group: 'Search (full-text RAG)',
    items: [
      {
        method: 'GET',
        path: '/api/v1/search/articles',
        doc: "Keyword search over Aileen's ~800 article chunks (Research Dispatch + Woman-in-Tech).",
        params: [
          { name: 'q', type: 'string', required: true, doc: 'query (≥2 chars)' },
          { name: 'k', type: 'integer', doc: 'max 10, default 3' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/search/articles?q=solana+validator'",
      },
      {
        method: 'GET',
        path: '/api/v1/search/earnings',
        doc: 'Keyword search over earnings-call transcript chunks.',
        params: [
          { name: 'q', type: 'string', required: true, doc: 'query (≥2 chars)' },
          { name: 'k', type: 'integer', doc: 'max 10, default 4' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/search/earnings?q=Rubin+yield'",
      },
      {
        method: 'GET',
        path: '/api/v1/search/research',
        doc: 'Keyword search over broker / analyst note chunks.',
        params: [
          { name: 'q', type: 'string', required: true, doc: 'query (≥2 chars)' },
          { name: 'k', type: 'integer', doc: 'max 10, default 4' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/search/research?q=Morgan+Stanley+Broadcom'",
      },
      {
        method: 'GET',
        path: '/api/v1/search/docs',
        doc: 'Keyword search over BOTH earnings and research corpora at once.',
        params: [
          { name: 'q', type: 'string', required: true, doc: 'query (≥2 chars)' },
          { name: 'k', type: 'integer', doc: 'max 10, default 5' },
        ],
        example: "curl 'https://aileena.xyz/api/v1/search/docs?q=HBM3E'",
      },
    ],
  },
  {
    group: 'Agentic LLM',
    items: [
      {
        method: 'POST',
        path: '/api/v1/query',
        doc: "Single-shot natural-language query routed through the same agent that powers the on-site chat. The LLM picks tools (chip lookup, pricing, news, earnings, research, articles), runs up to 4 steps, and returns a 2-3 sentence answer plus the tool-call trace it followed. Costs real DeepSeek tokens — rate-limited to 5 requests/min and 30/day per IP.",
        body: {
          schema: '{ "prompt": "string (≤1000 chars)" }',
          doc: 'Required JSON body. Single-turn — no conversation history is kept.',
        },
        example:
          "curl -X POST https://aileena.xyz/api/v1/query \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"prompt\": \"how has the H100 spot price moved this year?\"}'",
      },
    ],
  },
];

function Method({ m }: { m: 'GET' | 'POST' }) {
  return (
    <span
      className={`inline-block font-mono text-[0.7rem] uppercase px-2 py-0.5 rounded mr-3 ${
        m === 'GET' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/40 text-amber-300'
      }`}
    >
      {m}
    </span>
  );
}

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white/86 font-serif">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <header className="border-b border-white/10 pb-6 mb-10">
          <p className="font-mono text-[0.65rem] tracking-[0.28em] uppercase text-white/40 mb-2">
            aileena · machina · public api
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">Data API</h1>
          <p className="text-white/65 leading-relaxed">
            Public HTTP API over the chip specs, pricing observations, tracking items, earnings transcripts, and analyst
            research that Aileen maintains as part of her AI-hardware research. Same indices that power the on-site chat
            agent. <Link href="/" className="text-[#c4a8ff] hover:underline">← back to aileena.xyz</Link>
          </p>
        </header>

        <section className="mb-10">
          <h2 className="font-mono text-[0.7rem] tracking-[0.28em] uppercase text-white/50 mb-3">Base URL</h2>
          <pre className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono overflow-x-auto">
            https://aileena.xyz
          </pre>
        </section>

        <section className="mb-10">
          <h2 className="font-mono text-[0.7rem] tracking-[0.28em] uppercase text-white/50 mb-3">Authentication</h2>
          <p className="text-white/65 leading-relaxed mb-2">
            No auth in v1. Rate-limited by client IP:
          </p>
          <ul className="text-white/65 leading-relaxed list-disc pl-6 space-y-1">
            <li>Data endpoints (everything except <code className="font-mono text-sm">/query</code>): 30 reqs / 10 s burst, 1,000 / day.</li>
            <li>
              <code className="font-mono text-sm">/api/v1/query</code> (LLM): 5 reqs / min burst, 30 / day. Each call costs real model tokens.
            </li>
          </ul>
          <p className="text-white/55 text-sm mt-3 leading-relaxed">
            When limited you get HTTP 429 with a <code className="font-mono">Retry-After</code> header. Every response carries{' '}
            <code className="font-mono">X-RateLimit-Daily-Remaining</code> and <code className="font-mono">X-RateLimit-Burst-Remaining</code>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-mono text-[0.7rem] tracking-[0.28em] uppercase text-white/50 mb-3">Response shape</h2>
          <p className="text-white/65 leading-relaxed mb-2">Every response is JSON with one of two envelopes.</p>
          <pre className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono overflow-x-auto leading-6">
{`{ "ok": true,  "data":  { ... } }
{ "ok": false, "error": { "code": "...", "message": "..." } }`}
          </pre>
        </section>

        <section className="mb-10">
          <h2 className="font-mono text-[0.7rem] tracking-[0.28em] uppercase text-white/50 mb-3">CORS</h2>
          <p className="text-white/65 leading-relaxed">
            Open to all origins (<code className="font-mono">*</code>). Call from the browser, from a server, from anywhere.
          </p>
        </section>

        {ENDPOINTS.map((group) => (
          <section key={group.group} className="mb-12">
            <h2 className="text-xl font-semibold tracking-tight border-b border-white/10 pb-2 mb-5">{group.group}</h2>
            <div className="space-y-8">
              {group.items.map((e) => (
                <article key={e.path + e.method} className="border-l-2 border-white/10 pl-4">
                  <h3 className="font-mono text-sm mb-2">
                    <Method m={e.method} />
                    <span className="text-white">{e.path}</span>
                  </h3>
                  <p className="text-white/70 leading-relaxed text-[0.95rem] mb-3">{e.doc}</p>
                  {e.params && e.params.length > 0 && (
                    <div className="mb-3">
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40 mb-1">Params</p>
                      <ul className="text-sm space-y-1">
                        {e.params.map((p) => (
                          <li key={p.name}>
                            <code className="font-mono text-[#c4a8ff]">{p.name}</code>
                            <span className="text-white/40 ml-1">{p.type}</span>
                            {p.required && <span className="text-amber-300/80 ml-1">(required)</span>}
                            <span className="text-white/60 ml-2">— {p.doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {e.body && (
                    <div className="mb-3">
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40 mb-1">Body</p>
                      <pre className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono overflow-x-auto">
                        {e.body.schema}
                      </pre>
                      <p className="text-white/55 text-sm mt-1">{e.body.doc}</p>
                    </div>
                  )}
                  <pre className="bg-black/60 border border-white/10 rounded px-3 py-2 text-[0.78rem] font-mono overflow-x-auto leading-6">
                    {e.example}
                  </pre>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="mb-16">
          <h2 className="font-mono text-[0.7rem] tracking-[0.28em] uppercase text-white/50 mb-3">Data freshness</h2>
          <p className="text-white/65 leading-relaxed">
            Indices rebuild on every Vercel deploy. As Aileen adds data files, those entries become queryable on the next
            push. Earnings + research corpora are passages from publicly disclosed material (calls + paywalled notes
            paraphrased / quoted under fair use). Confidence levels (
            <code className="font-mono">public</code> / <code className="font-mono">analyst</code> /{' '}
            <code className="font-mono">rumour</code> / <code className="font-mono">leak</code>) on news entries are
            self-declared and worth checking before citing.
          </p>
        </section>

        <footer className="border-t border-white/10 pt-6 text-white/45 text-sm font-mono tracking-[0.06em]">
          aileena · machina · v1 · public read-only · open auth tbd · contact rosazxc0915@gmail.com
        </footer>
      </div>
    </main>
  );
}
