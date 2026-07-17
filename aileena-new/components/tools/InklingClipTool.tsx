'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';

type JobProgress = {
  phase: string;
  message: string;
  progress: number;
};

type PublicCandidate = {
  index: number;
  title: string;
  reason: string;
  score: number;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  youtubeAt: string;
  downloadUrl: string;
};

type JobView = {
  id: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress: JobProgress;
  error: string | null;
  result: {
    title: string;
    candidates: PublicCandidate[];
  } | null;
};

const slotStyle: CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 8,
  border: '2px inset rgba(0,0,0,0.35)',
  background: 'rgba(0,0,0,0.35)',
  color: '#d8fff9',
  fontFamily: mono,
  fontSize: '0.82rem',
  outline: 'none',
};

const modeBtn = (active: boolean, disabled: boolean): CSSProperties => ({
  padding: '9px 14px',
  borderRadius: 8,
  border: active ? '2px solid rgba(0,169,159,0.8)' : '2px solid rgba(255,253,248,0.12)',
  background: active ? 'rgba(0,169,159,0.18)' : 'rgba(0,0,0,0.25)',
  color: active ? '#b8fff8' : 'rgba(255,253,248,0.72)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: mono,
  fontSize: '0.72rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});

function phaseLabel(
  phase: string,
  labels: Record<string, string>,
): string {
  return labels[phase] ?? phase.toUpperCase();
}

export default function InklingClipTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.inklingClips;
  const tool = getToolBySlug('inkling-clips');

  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'best' | 'query'>('best');
  const [query, setQuery] = useState('');
  const [bestCount, setBestCount] = useState(3);
  const [job, setJob] = useState<JobView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollJob = useCallback(
    async (jobId: string) => {
      const res = await fetch(`/api/tools/inkling-clips?jobId=${encodeURIComponent(jobId)}`);
      const json = (await res.json()) as { ok: boolean; data?: JobView; error?: { message: string } };
      if (!json.ok || !json.data) {
        setError(json.error?.message ?? tx.errors.pollFailed);
        stopPolling();
        setSubmitting(false);
        return;
      }
      setJob(json.data);
      if (json.data.status === 'done' || json.data.status === 'error') {
        stopPolling();
        setSubmitting(false);
        if (json.data.status === 'error') {
          setError(json.data.error ?? tx.errors.jobFailed);
        }
      }
    },
    [stopPolling, tx.errors.jobFailed, tx.errors.pollFailed],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setJob(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/tools/inkling-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          mode,
          query: mode === 'query' ? query.trim() : undefined,
          bestCount,
          dryRun: false,
          audioOnly: false,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { jobId: string };
        error?: { message: string };
      };
      if (!json.ok || !json.data?.jobId) {
        setError(json.error?.message ?? tx.errors.startFailed);
        setSubmitting(false);
        return;
      }

      const jobId = json.data.jobId;
      await pollJob(jobId);
      pollRef.current = setInterval(() => void pollJob(jobId), 2500);
    } catch {
      setError(tx.errors.network);
      setSubmitting(false);
    }
  }

  const progress = job?.progress?.progress ?? 0;
  const running = submitting || job?.status === 'queued' || job?.status === 'running';
  const phase = job?.progress?.phase ?? 'download';

  return (
    <ArcadeLayout
      tag={tx.tag}
      title={tx.heading}
      subtitle={tx.body}
      backLabel={tx.backToTools}
      backHref="/tools"
      marquee={`CLIP QUEST · ${tx.modeBest.toUpperCase()} · ${tx.modeQuery.toUpperCase()} · INKLING · FFMPEG`}
    >
      <ArcadeCabinetFrame
        glyph={tool?.arcade.glyph ?? '▶'}
        screenGradient={tool?.arcade.screenGradient ?? 'linear-gradient(180deg,#12352f,#020807)'}
      >
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label htmlFor="yt-url" style={{ display: 'block', fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.1em', color: 'rgba(255,253,248,0.45)', marginBottom: 8 }}>
              {tx.youtubeLabel}
            </label>
            <input
              id="yt-url"
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={slotStyle}
              disabled={running}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setMode('best')} disabled={running} style={modeBtn(mode === 'best', running)}>
              {tx.modeBest}
            </button>
            <button type="button" onClick={() => setMode('query')} disabled={running} style={modeBtn(mode === 'query', running)}>
              {tx.modeQuery}
            </button>
          </div>

          {mode === 'query' ? (
            <div>
              <label htmlFor="topic" style={{ display: 'block', fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.1em', color: 'rgba(255,253,248,0.45)', marginBottom: 8 }}>
                {tx.queryLabel}
              </label>
              <input
                id="topic"
                type="text"
                required
                placeholder={tx.queryPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={slotStyle}
                disabled={running}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="count" style={{ display: 'block', fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.1em', color: 'rgba(255,253,248,0.45)', marginBottom: 8 }}>
                {tx.countLabel}
              </label>
              <input
                id="count"
                type="number"
                min={1}
                max={8}
                value={bestCount}
                onChange={(e) => setBestCount(Number(e.target.value))}
                style={{ ...slotStyle, maxWidth: 96 }}
                disabled={running}
              />
            </div>
          )}

          <button type="submit" className="arcade-start-btn" disabled={running || !url.trim()}>
            {running ? tx.running : tx.submit}
          </button>
        </form>

        <p style={{ margin: '14px 0 0', fontFamily: mono, fontSize: '0.68rem', color: 'rgba(255,253,248,0.38)', lineHeight: 1.5 }}>
          {tx.disclaimer}
        </p>
      </ArcadeCabinetFrame>

      {error ? (
        <p
          role="alert"
          style={{
            marginTop: 24,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(120,20,20,0.35)',
            border: '2px solid rgba(255,80,80,0.35)',
            color: '#ffc9c9',
            fontFamily: mono,
            fontSize: '0.82rem',
          }}
        >
          {phaseLabel('error', tx.levelLabels)} — {error}
        </p>
      ) : null}

      {running && job ? (
        <div style={{ marginTop: 28, maxWidth: 720 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontFamily: mono, fontSize: '0.72rem', color: '#00a99f', letterSpacing: '0.08em' }}>
              {phaseLabel(phase, tx.levelLabels)}
            </span>
            <div className="arcade-wave" aria-hidden>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <span key={n} style={{ height: 8 + (n % 4) * 6 }} />
              ))}
            </div>
          </div>
          <div
            style={{
              height: 14,
              borderRadius: 4,
              background: 'rgba(0,0,0,0.45)',
              border: '2px inset rgba(255,253,248,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(6, progress)}%`,
                background: 'linear-gradient(90deg, #008f86, #35d4c8, #00a99f)',
                transition: 'width 0.45s ease',
                boxShadow: '0 0 12px rgba(0,169,159,0.45)',
              }}
            />
          </div>
          <p style={{ marginTop: 10, fontFamily: mono, fontSize: '0.78rem', color: 'rgba(255,253,248,0.5)' }}>
            {tx.listening} · {job.progress.message}
          </p>
        </div>
      ) : null}

      {job?.status === 'done' && job.result ? (
        <section style={{ marginTop: 40, maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#fffdf8' }}>
              {tx.highScore}
            </h2>
            <span style={{ fontFamily: mono, fontSize: '0.72rem', color: 'rgba(255,253,248,0.4)' }}>
              {job.result.title}
            </span>
          </div>
          <p style={{ fontFamily: mono, fontSize: '0.72rem', color: 'rgba(255,253,248,0.42)', marginBottom: 20 }}>
            {tx.resultsHint}
          </p>
          <div style={{ display: 'grid', gap: 14 }}>
            {job.result.candidates.map((c, i) => (
              <article
                key={c.index}
                className="arcade-score-card"
                style={{
                  padding: '16px 18px',
                  borderRadius: 12,
                  border: '2px solid rgba(255,253,248,0.1)',
                  background: 'linear-gradient(180deg, rgba(255,253,248,0.05), rgba(255,253,248,0.02))',
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#fffdf8' }}>{c.title}</h3>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: '0.72rem',
                      color: '#c9872f',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {tx.scoreLabel} {(c.score * 100).toFixed(0)}
                  </span>
                </div>
                <p style={{ margin: '0 0 6px', fontFamily: mono, fontSize: '0.72rem', color: 'rgba(255,253,248,0.42)' }}>
                  {c.startLabel} → {c.endLabel} · {c.durationLabel}
                </p>
                <p style={{ margin: '0 0 14px', fontSize: '0.88rem', lineHeight: 1.55, color: 'rgba(255,253,248,0.62)' }}>
                  {c.reason}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href={c.youtubeAt}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: mono,
                      fontSize: '0.68rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,253,248,0.16)',
                      color: '#fffdf8',
                      textDecoration: 'none',
                    }}
                  >
                    {tx.openYoutube}
                  </a>
                  <a
                    href={c.downloadUrl}
                    style={{
                      fontFamily: mono,
                      fontSize: '0.68rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,169,159,0.2)',
                      border: '1px solid rgba(0,169,159,0.4)',
                      color: '#b8fff8',
                      textDecoration: 'none',
                    }}
                  >
                    {tx.downloadClip}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </ArcadeLayout>
  );
}
