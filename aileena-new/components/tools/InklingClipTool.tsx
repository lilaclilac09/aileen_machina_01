'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
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

type HostStatus = {
  ready: boolean;
  hint: string;
  media: { ok: boolean; error: string | null };
  api: { ok: boolean; error: string | null };
};

const slotStyle: CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 0,
  border: 'none',
  background: '#f3f0e8',
  color: '#14110c',
  fontFamily: mono,
  fontSize: '0.82rem',
  outline: 'none',
};

const modeBtn = (active: boolean, disabled: boolean): CSSProperties => ({
  padding: '9px 14px',
  borderRadius: 0,
  border: 'none',
  background: active ? '#00a99f' : '#f3f0e8',
  color: active ? '#fffdf8' : 'rgba(20,17,12,0.72)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: mono,
  fontSize: '0.72rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});

function phaseLabel(phase: string, labels: Record<string, string>): string {
  return labels[phase] ?? phase.toUpperCase();
}

function shellQuote(s: string): string {
  if (!/[^\w./:=+-]/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
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
  const [host, setHost] = useState<HostStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/tools/inkling-clips/status');
        const json = (await res.json()) as { ok: boolean; data?: HostStatus };
        if (!cancelled && json.ok && json.data) setHost(json.data);
      } catch {
        if (!cancelled) {
          setHost({
            ready: false,
            hint: 'Could not reach status endpoint.',
            media: { ok: false, error: 'unknown' },
            api: { ok: false, error: 'unknown' },
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setJob(null);
    setSubmitting(true);
    stopPolling();

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
      setJob({
        id: jobId,
        status: 'queued',
        progress: { phase: 'download', message: 'Queued', progress: 0 },
        error: null,
        result: null,
      });
      pollRef.current = setInterval(() => {
        void pollJob(jobId);
      }, 2000);
      void pollJob(jobId);
    } catch {
      setError(tx.errors.network);
      setSubmitting(false);
    }
  }

  const running = submitting || job?.status === 'queued' || job?.status === 'running';
  const progress = job?.progress?.progress ?? 0;
  const phase = job?.progress?.phase ?? 'download';
  const canRun = host?.ready === true;

  const cliCommand = useMemo(() => {
    const u = url.trim() || 'https://www.youtube.com/watch?v=VIDEO_ID';
    const base = `pnpm inkling:clips -- ${shellQuote(u)}`;
    if (mode === 'query') {
      return `${base} --query ${shellQuote(query.trim() || 'your topic')}`;
    }
    return `${base} --best ${Math.min(8, Math.max(1, bestCount || 3))}`;
  }, [url, mode, query, bestCount]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(cliCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <ArcadeLayout
      tag={tx.tag}
      title={tx.heading}
      subtitle={tx.body}
      backLabel={tx.backToTools}
      backHref="/tools"
      marquee={`AUDIO CLIPPING · RUN · CLI · INKLING · FFMPEG`}
    >
      <ArcadeCabinetFrame
        glyph={tool?.arcade.glyph ?? '▶'}
        screenGradient={tool?.arcade.screenGradient ?? '#d8eeeb'}
      >
        <p
          style={{
            margin: '0 0 16px',
            padding: '12px 14px',
            background: canRun ? '#d8eeeb' : '#f3f0e8',
            fontFamily: mono,
            fontSize: '0.78rem',
            lineHeight: 1.55,
            color: 'rgba(20,17,12,0.62)',
          }}
        >
          {host
            ? canRun
              ? tx.hostReady
              : `${tx.hostNotReady} ${host.hint}`
            : tx.hostChecking}
        </p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label
              htmlFor="yt-url"
              style={{
                display: 'block',
                fontFamily: mono,
                fontSize: '0.68rem',
                letterSpacing: '0.1em',
                color: 'rgba(20,17,12,0.45)',
                marginBottom: 8,
              }}
            >
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
            <button
              type="button"
              onClick={() => setMode('best')}
              disabled={running}
              style={modeBtn(mode === 'best', running)}
            >
              {tx.modeBest}
            </button>
            <button
              type="button"
              onClick={() => setMode('query')}
              disabled={running}
              style={modeBtn(mode === 'query', running)}
            >
              {tx.modeQuery}
            </button>
          </div>

          {mode === 'query' ? (
            <div>
              <label
                htmlFor="topic"
                style={{
                  display: 'block',
                  fontFamily: mono,
                  fontSize: '0.68rem',
                  letterSpacing: '0.1em',
                  color: 'rgba(20,17,12,0.45)',
                  marginBottom: 8,
                }}
              >
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
              <label
                htmlFor="count"
                style={{
                  display: 'block',
                  fontFamily: mono,
                  fontSize: '0.68rem',
                  letterSpacing: '0.1em',
                  color: 'rgba(20,17,12,0.45)',
                  marginBottom: 8,
                }}
              >
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

          <button
            type="submit"
            className="arcade-start-btn"
            disabled={running || !url.trim() || !canRun}
            title={!canRun ? tx.hostNotReady : undefined}
          >
            {running ? tx.running : tx.submit}
          </button>
        </form>

        <p style={{ margin: '14px 0 0', fontFamily: mono, fontSize: '0.68rem', color: 'rgba(20,17,12,0.4)', lineHeight: 1.5 }}>
          {tx.disclaimer}
        </p>

        <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
          <p style={{ margin: 0, fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.1em', color: 'rgba(20,17,12,0.45)', textTransform: 'uppercase' }}>
            {tx.commandLabel}
          </p>
          <pre
            style={{
              margin: 0,
              padding: '14px 16px',
              background: '#14110c',
              color: '#f4f1ea',
              fontFamily: mono,
              fontSize: '0.78rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {cliCommand}
          </pre>
          <button type="button" className="arcade-start-btn" onClick={() => void copyCommand()} style={{ background: '#14110c' }}>
            {copied ? tx.copied : tx.copyCommand}
          </button>
        </div>
      </ArcadeCabinetFrame>

      {error ? (
        <p
          role="alert"
          style={{
            marginTop: 24,
            padding: '12px 14px',
            borderRadius: 0,
            background: '#f3e0e0',
            color: '#8a2a2a',
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
          <div style={{ height: 10, background: 'rgba(20,17,12,0.06)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(6, progress)}%`,
                background: '#00a99f',
                transition: 'width 0.45s ease',
              }}
            />
          </div>
          <p style={{ marginTop: 10, fontFamily: mono, fontSize: '0.78rem', color: 'rgba(20,17,12,0.5)' }}>
            {tx.listening} · {job.progress.message}
          </p>
        </div>
      ) : null}

      {job?.status === 'done' && job.result ? (
        <section style={{ marginTop: 40, maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#14110c' }}>{tx.highScore}</h2>
            <span style={{ fontFamily: mono, fontSize: '0.72rem', color: 'rgba(20,17,12,0.4)' }}>{job.result.title}</span>
          </div>
          <p style={{ fontFamily: mono, fontSize: '0.72rem', color: 'rgba(20,17,12,0.42)', marginBottom: 20 }}>
            {tx.resultsHint}
          </p>
          <div style={{ display: 'grid', gap: 14 }}>
            {job.result.candidates.map((c, i) => (
              <article
                key={c.index}
                className="arcade-score-card"
                style={{ padding: '16px 0', animationDelay: `${i * 0.08}s` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#14110c' }}>{c.title}</h3>
                  <span style={{ fontFamily: mono, fontSize: '0.72rem', color: '#c9872f' }}>
                    {tx.scoreLabel} {(c.score * 100).toFixed(0)}
                  </span>
                </div>
                <p style={{ margin: '0 0 6px', fontFamily: mono, fontSize: '0.72rem', color: 'rgba(20,17,12,0.42)' }}>
                  {c.startLabel} → {c.endLabel} · {c.durationLabel}
                </p>
                <p style={{ margin: '0 0 14px', fontSize: '0.88rem', lineHeight: 1.55, color: 'rgba(20,17,12,0.62)' }}>
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
                      background: '#f3f0e8',
                      color: '#14110c',
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
                      background: '#00a99f',
                      color: '#fffdf8',
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
