'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import SubstackShell from '../_substack/SubstackShell';
import '../semi-watch-tpu-cpo/semi-watch.css';

/**
 * Software YouTube shelf — MCP for now.
 * Rust quick-master slot left open until a link is chosen.
 */

type Clip = {
  id: string;
  title: string;
  channel: string;
  role: string;
  note: string;
  first?: boolean;
  badge?: string;
};

const CLIPS: Clip[] = [
  {
    id: 'cGuyrANVi4A',
    title: 'What is the Model Context Protocol (MCP)?',
    channel: 'Explainers',
    role: 'MCP · intro',
    badge: 'MCP',
    note: 'Clients and servers, tools / resources / prompts / context — why models need a protocol above bespoke API glue.',
    first: true,
  },
  {
    id: '185XGEMefgc',
    title: 'MCP vs API — how models talk to tools',
    channel: 'Explainers',
    role: 'MCP · comparison',
    badge: 'MCP',
    note: 'MCP does not kill APIs — it sits on top of them. The client becomes the model; discovery replaces hardcoded endpoints.',
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

export default function SoftwareWatchArticle() {
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
      category="Software"
      date="2026.08.07"
      tags="MCP · Agents · YouTube · Protocol"
      title="Software YouTube — MCP"
      dek="In-page theater for two Model Context Protocol explainers. Start with what MCP is, then MCP vs API. A quick-master Rust slot stays open until the right video lands."
      showNarration={false}
    >
      <div className="semi-watch">
        <p className="semi-watch-lede">
          Software shelf — protocols first, not hardware. Curriculum spine (Rust → CLI → eval →
          LoRA):{' '}
          <Link href="/blog/post-training-path">Post-Training Path</Link>
          . Pair with{' '}
          <Link href="/blog/cli">The CLI Was Always the Trading Floor</Link>
          {' '}(MCP in the stack),{' '}
          <Link href="/blog/centaur">Centaur</Link>
          , and the hardware watch list{' '}
          <Link href="/blog/semi-watch-tpu-cpo">TPU &amp; CPO</Link>.
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
                      {clip.badge ? ` · ${clip.badge}` : ''}
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
            <li>What is MCP — discovery, tools, resources, why models need the protocol.</li>
            <li>MCP vs API — MCP on top of APIs; model as the client.</li>
            <li>
              Rust quick-master — video TBD; until then follow{' '}
              <Link href="/blog/post-training-path">Post-Training Path</Link> (Rust → CLI → eval →
              SFT).
            </li>
          </ol>
          <p className="semi-watch-back">
            <Link href="/blog/post-training-path">← Post-training path</Link>
            {' · '}
            <Link href="/blog/semi-watch-tpu-cpo">TPU &amp; CPO YouTube shelf</Link>
          </p>
        </article>
      </div>
    </SubstackShell>
  );
}
