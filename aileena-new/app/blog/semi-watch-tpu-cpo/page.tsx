'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import SubstackShell from '../_substack/SubstackShell';
import './semi-watch.css';

/**
 * Curated YouTube — high picture + high density.
 * Light Substack shell + one theater + one playlist (no triple repeat).
 */

type Clip = {
  id: string;
  title: string;
  channel: string;
  role: string;
  note: string;
  first?: boolean;
};

const CLIPS: Clip[] = [
  {
    id: 'kS8r7UcexJU',
    title: 'NVIDIA official deep dive — CPO switch',
    channel: 'NVIDIA',
    role: 'CPO',
    note: 'Best first stop on co-packaged optics: picture and explanation both hold up.',
    first: true,
  },
  {
    id: '_ra1Gyiz-DA',
    title: 'Broadcom CPO technology breakthrough (official)',
    channel: 'Broadcom',
    role: 'CPO',
    note: 'Vendor-side breakthrough framing — pair with the NVIDIA switch walk-through.',
    first: true,
  },
  {
    id: 'coPKHrE2ATI',
    title: 'Ironwood (7th-gen TPU) — official unbox + lab footage',
    channel: 'Google',
    role: 'TPU · Nov 2025',
    note: 'Newest Ironwood look: packaging, cooling, lab reality — not a slide deck.',
    first: true,
  },
  {
    id: 'FsxthdQ_sL4',
    title: 'Inside a TPU data center',
    channel: 'Google / Cloud',
    role: 'TPU · facility',
    note: 'Liquid cooling, optical interconnect, Pod scale — the machine as a building.',
  },
  {
    id: '8zBaa20mvoc',
    title: 'TPU architecture — MXU and systolic array',
    channel: 'Technical talk',
    role: 'TPU · architecture',
    note: 'Where the math units sit and why the array shape matters for dense matmul.',
  },
  {
    id: 'JC84GCU7zqA',
    title: 'Systolic array — principle + animation',
    channel: 'Explainers',
    role: 'TPU · dataflow',
    note: 'Clearest animation of how data walks the array — core Ironwood-era intuition.',
  },
  {
    id: 'I43NeVU9gW8',
    title: 'NVIDIA full CPO networking for agentic AI',
    channel: 'NVIDIA',
    role: 'CPO · systems',
    note: 'Why optics move onto the package when agentic / cluster scale blows past pluggables.',
  },
  {
    id: '8PofmPivZWE',
    title: 'Corning glass-substrate CPO — 3D animation',
    channel: 'Corning',
    role: 'CPO · packaging',
    note: 'Highest-quality 3D model here — glass substrate and optical path made visible.',
  },
];

function embedSrc(id: string, autoplay: boolean) {
  const q = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    color: 'white',
    ...(autoplay ? { autoplay: '1' } : {}),
  });
  return `https://www.youtube.com/embed/${id}?${q.toString()}`;
}

function thumbSrc(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export default function SemiWatchTpuCpoArticle() {
  const [activeId, setActiveId] = useState(CLIPS[0].id);
  const [started, setStarted] = useState(false);

  const active = useMemo(
    () => CLIPS.find((c) => c.id === activeId) ?? CLIPS[0],
    [activeId],
  );

  const play = (id: string) => {
    setActiveId(id);
    setStarted(true);
    if (typeof document !== 'undefined') {
      document.getElementById('semi-theater')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <SubstackShell
      category="Hardware"
      date="2026.08.07"
      tags="TPU · Ironwood · CPO · NVIDIA · Broadcom · Corning · YouTube"
      title="TPU & CPO — High-Signal YouTube Only"
      dek="Google TPU and co-packaged-optics clips where picture quality and information density both clear the bar. One in-page theater — start with NVIDIA + Broadcom CPO, then Ironwood."
      showNarration={false}
    >
      {/* Outside <article> so Substack flatteners don't strip the player chrome */}
      <div className="semi-watch">
        <p className="semi-watch-lede">
          Filter: YouTube only, strong on <em>both</em> image and density. Essays for numbers —{' '}
          <Link href="/blog/cpo">How CPO Actually Gets Built</Link>
          {', '}
          <Link href="/blog/let-there-be-light">Let There Be Light Modules</Link>
          {', '}
          <Link href="/blog/ai-pcb">The PCB Stack Inside an AI Rack</Link>
          . Basics —{' '}
          <Link href="/blog/semi-basics-review">Concepts You Think You Know</Link>
          . Software (MCP) —{' '}
          <Link href="/blog/software-watch">Software YouTube shelf</Link>.
        </p>

        <section id="semi-theater" className="semi-watch-theater" aria-label="In-page YouTube player">
          <p className="semi-watch-kicker">Now playing · {active.role}</p>
          <div className="semi-watch-frame">
            {started ? (
              <iframe
                key={active.id}
                src={embedSrc(active.id, true)}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="semi-watch-poster"
                onClick={() => play(active.id)}
                aria-label={`Play ${active.title}`}
                style={{ backgroundImage: `url(${thumbSrc(active.id)})` }}
              >
                <span className="semi-watch-poster-veil" />
                <span className="semi-watch-play" aria-hidden>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
          <h2 className="semi-watch-title">{active.title}</h2>
          <p className="semi-watch-meta">
            <span>{active.channel}</span>
            <span aria-hidden>·</span>
            <a
              href={`https://www.youtube.com/watch?v=${active.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open on YouTube
            </a>
          </p>
          <p className="semi-watch-note">{active.note}</p>
        </section>

        <section className="semi-watch-playlist" aria-label="Playlist">
          <p className="semi-watch-kicker">Playlist · click to play here</p>
          <div className="semi-watch-grid">
            {CLIPS.map((clip, i) => {
              const on = clip.id === activeId;
              return (
                <button
                  key={clip.id}
                  type="button"
                  className={`semi-watch-card${on ? ' is-active' : ''}`}
                  onClick={() => play(clip.id)}
                >
                  <span className="semi-watch-card-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbSrc(clip.id)} alt="" loading="lazy" />
                    <span className="semi-watch-card-badge">
                      {String(i + 1).padStart(2, '0')}
                      {clip.first ? ' · first' : ''}
                    </span>
                  </span>
                  <span className="semi-watch-card-body">
                    <span className="semi-watch-card-role">{clip.role}</span>
                    <span className="semi-watch-card-title">{clip.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <article className="semi-watch-article">
          <h3>Watch order</h3>
          <ol>
            <li>NVIDIA CPO switch + Broadcom CPO official (package vs pluggable).</li>
            <li>Ironwood unbox (what a current TPU looks like in the lab).</li>
            <li>Systolic-array animation → TPU architecture → data-center walk.</li>
            <li>NVIDIA agentic CPO network + Corning glass animation.</li>
            <li>
              Return to <Link href="/blog/cpo">CPO manufacturing / yield</Link> for supply-chain
              numbers.
            </li>
          </ol>
          <p className="semi-watch-back">
            <Link href="/blog/semi-basics-review">← Semi basics review</Link>
          </p>
        </article>
      </div>
    </SubstackShell>
  );
}
