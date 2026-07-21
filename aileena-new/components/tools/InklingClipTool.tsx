'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';

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

const modeBtn = (active: boolean): CSSProperties => ({
  padding: '9px 14px',
  borderRadius: 0,
  border: 'none',
  background: active ? '#00a99f' : '#f3f0e8',
  color: active ? '#fffdf8' : 'rgba(20,17,12,0.72)',
  cursor: 'pointer',
  fontFamily: mono,
  fontSize: '0.72rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});

function shellQuote(s: string): string {
  if (!/[^\w./:=+-]/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export default function InklingClipTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.inklingClips;
  const tool = getToolBySlug('inkling-clips');

  const [url, setUrl] = useState('https://www.youtube.com/watch?v=VIDEO_ID');
  const [mode, setMode] = useState<'best' | 'query'>('best');
  const [query, setQuery] = useState('');
  const [bestCount, setBestCount] = useState(3);
  const [copied, setCopied] = useState(false);

  const command = useMemo(() => {
    const u = url.trim() || 'https://www.youtube.com/watch?v=VIDEO_ID';
    const base = `pnpm inkling:clips -- ${shellQuote(u)}`;
    if (mode === 'query') {
      const q = query.trim() || 'your topic';
      return `${base} --query ${shellQuote(q)}`;
    }
    return `${base} --best ${Math.min(8, Math.max(1, bestCount || 3))}`;
  }, [url, mode, query, bestCount]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
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
      marquee={`AUDIO CLIPPING · CLI · INKLING · FFMPEG · LOCAL RUN`}
    >
      <ArcadeCabinetFrame
        glyph={tool?.arcade.glyph ?? '▶'}
        screenGradient={tool?.arcade.screenGradient ?? '#d8eeeb'}
      >
        <p
          style={{
            margin: '0 0 18px',
            padding: '12px 14px',
            background: '#f3f0e8',
            fontFamily: mono,
            fontSize: '0.78rem',
            lineHeight: 1.55,
            color: 'rgba(20,17,12,0.62)',
          }}
        >
          {tx.webNote}
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
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
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={slotStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setMode('best')} style={modeBtn(mode === 'best')}>
              {tx.modeBest}
            </button>
            <button type="button" onClick={() => setMode('query')} style={modeBtn(mode === 'query')}>
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
                placeholder={tx.queryPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={slotStyle}
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
              />
            </div>
          )}

          <div>
            <p
              style={{
                margin: '0 0 8px',
                fontFamily: mono,
                fontSize: '0.68rem',
                letterSpacing: '0.1em',
                color: 'rgba(20,17,12,0.45)',
                textTransform: 'uppercase',
              }}
            >
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
              {command}
            </pre>
          </div>

          <button type="button" className="arcade-start-btn" onClick={() => void copyCommand()}>
            {copied ? tx.copied : tx.copyCommand}
          </button>
        </div>

        <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
          <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem', color: 'rgba(20,17,12,0.45)' }}>
            {tx.prereqTitle}
          </p>
          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: '0.88rem',
              lineHeight: 1.6,
              color: 'rgba(20,17,12,0.62)',
            }}
          >
            <li>{tx.prereqBrew}</li>
            <li>{tx.prereqKey}</li>
            <li>{tx.prereqCd}</li>
          </ol>
          <p style={{ margin: 0, fontFamily: mono, fontSize: '0.68rem', color: 'rgba(20,17,12,0.4)', lineHeight: 1.5 }}>
            {tx.disclaimer}
          </p>
        </div>
      </ArcadeCabinetFrame>
    </ArcadeLayout>
  );
}
