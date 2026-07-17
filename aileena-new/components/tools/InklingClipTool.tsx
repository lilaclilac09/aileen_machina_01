'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import ToolShell from './ToolShell';

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

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 10,
  border: '1px solid rgba(255,253,248,0.14)',
  background: 'rgba(255,253,248,0.04)',
  color: '#fffdf8',
  fontSize: '0.98rem',
  outline: 'none',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgba(255,253,248,0.45)',
  marginBottom: 8,
};

export default function InklingClipTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.inklingClips;

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

  return (
    <ToolShell
      tag={tx.tag}
      title={tx.heading}
      subtitle={tx.body}
      backLabel={tx.backToTools}
      backHref="/tools"
    >
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 20, maxWidth: 640 }}>
        <div>
          <label htmlFor="yt-url" style={labelStyle}>
            {tx.youtubeLabel}
          </label>
          <input
            id="yt-url"
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={inputStyle}
            disabled={running}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setMode('best')}
            disabled={running}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: '1px solid',
              borderColor: mode === 'best' ? 'rgba(0,169,159,0.7)' : 'rgba(255,253,248,0.14)',
              background: mode === 'best' ? 'rgba(0,169,159,0.14)' : 'transparent',
              color: '#fffdf8',
              cursor: running ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem',
            }}
          >
            {tx.modeBest}
          </button>
          <button
            type="button"
            onClick={() => setMode('query')}
            disabled={running}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: '1px solid',
              borderColor: mode === 'query' ? 'rgba(0,169,159,0.7)' : 'rgba(255,253,248,0.14)',
              background: mode === 'query' ? 'rgba(0,169,159,0.14)' : 'transparent',
              color: '#fffdf8',
              cursor: running ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem',
            }}
          >
            {tx.modeQuery}
          </button>
        </div>

        {mode === 'query' ? (
          <div>
            <label htmlFor="topic" style={labelStyle}>
              {tx.queryLabel}
            </label>
            <input
              id="topic"
              type="text"
              required
              placeholder={tx.queryPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={inputStyle}
              disabled={running}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="count" style={labelStyle}>
              {tx.countLabel}
            </label>
            <input
              id="count"
              type="number"
              min={1}
              max={8}
              value={bestCount}
              onChange={(e) => setBestCount(Number(e.target.value))}
              style={{ ...inputStyle, maxWidth: 120 }}
              disabled={running}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={running || !url.trim()}
          style={{
            justifySelf: 'start',
            padding: '12px 22px',
            borderRadius: 10,
            border: 'none',
            background: running ? 'rgba(255,253,248,0.18)' : '#00a99f',
            color: running ? 'rgba(255,253,248,0.6)' : '#041010',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: running ? 'wait' : 'pointer',
          }}
        >
          {running ? tx.running : tx.submit}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: '0.82rem', color: 'rgba(255,253,248,0.42)', maxWidth: 640 }}>
        {tx.disclaimer}
      </p>

      {error ? (
        <p
          role="alert"
          style={{
            marginTop: 24,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(180,40,40,0.18)',
            border: '1px solid rgba(255,120,120,0.25)',
            color: '#ffc9c9',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </p>
      ) : null}

      {running && job ? (
        <div style={{ marginTop: 32, maxWidth: 640 }}>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: 'rgba(255,253,248,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(4, progress)}%`,
                background: 'linear-gradient(90deg, #00a99f, #7fd4cc)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <p style={{ marginTop: 10, fontSize: '0.88rem', color: 'rgba(255,253,248,0.55)' }}>
            {job.progress.message}
          </p>
        </div>
      ) : null}

      {job?.status === 'done' && job.result ? (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 500, marginBottom: 8, color: '#fffdf8' }}>
            {job.result.title}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,253,248,0.45)', marginBottom: 24 }}>
            {tx.resultsHint}
          </p>
          <div style={{ display: 'grid', gap: 16 }}>
            {job.result.candidates.map((c) => (
              <article
                key={c.index}
                style={{
                  padding: '18px 20px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,253,248,0.1)',
                  background: 'rgba(255,253,248,0.03)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 8,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fffdf8' }}>{c.title}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,253,248,0.45)' }}>
                    {c.startLabel} → {c.endLabel} ({c.durationLabel})
                  </span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '0.9rem', lineHeight: 1.55, color: 'rgba(255,253,248,0.62)' }}>
                  {c.reason}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a
                    href={c.youtubeAt}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.8rem',
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
                      fontSize: '0.8rem',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,169,159,0.18)',
                      border: '1px solid rgba(0,169,159,0.35)',
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
    </ToolShell>
  );
}
