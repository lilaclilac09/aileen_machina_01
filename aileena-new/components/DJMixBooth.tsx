'use client';

import { useState } from 'react';
import type { MixReceipt } from '../lib/djMixReceipt';

const C = {
  text: '#fffdf8',
  dim: 'rgba(255,253,248,0.42)',
  sub: 'rgba(255,253,248,0.62)',
  cyan: '#00a89d',
  orange: '#ff9b5e',
  panel: '#12161b',
};

const SOUNDCLOUD_UPLOAD = 'https://soundcloud.com/upload';

const btn: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 4,
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: '0.4rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  background: '#14181e',
  border: '1px solid rgba(170,179,187,0.22)',
  color: C.text,
};

export default function DJMixBooth({
  recording,
  recSec,
  exportReady,
  exportMime,
  receipt,
  error,
  onRecord,
  onStop,
  onDownloadAudio,
  onDownloadMeta,
  onCopyReceipt,
  onLoadUrl,
}: {
  recording: boolean;
  recSec: number;
  exportReady: boolean;
  exportMime: string;
  receipt: MixReceipt | null;
  error: string | null;
  onRecord: () => void;
  onStop: () => void;
  onDownloadAudio: () => void;
  onDownloadMeta: () => void;
  onCopyReceipt: () => void;
  onLoadUrl: (side: 'left' | 'right', url: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [urlSide, setUrlSide] = useState<'left' | 'right'>('left');
  const fmt = `${Math.floor(recSec / 60)}:${String(Math.floor(recSec % 60)).padStart(2, '0')}`;
  const ext = exportMime.includes('mp4') ? 'm4a' : 'webm';

  return (
    <div
      data-testid="dj-mix-booth"
      style={{
        marginTop: 10,
        borderRadius: 10,
        padding: '10px 12px',
        background: C.panel,
        border: '1px solid rgba(170,179,187,0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.34rem', letterSpacing: '0.45em', color: C.dim }}>
          MASTER RECORD
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', letterSpacing: '0.08em', color: C.sub }}>
          records the mixed bus · {ext} · not a single deck
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <button
          data-testid="dj-record"
          type="button"
          onClick={recording ? onStop : onRecord}
          style={{
            ...btn,
            border: `1px solid ${recording ? 'rgba(255,155,94,0.55)' : 'rgba(0,168,157,0.45)'}`,
            color: recording ? C.orange : C.cyan,
            boxShadow: recording ? '0 0 10px rgba(255,155,94,0.25)' : 'none',
          }}
        >
          {recording ? `■ stop  ${fmt}` : '● record master'}
        </button>
        <button
          data-testid="dj-export-audio"
          type="button"
          disabled={!exportReady}
          onClick={onDownloadAudio}
          title={exportReady ? `download mix .${ext}` : 'record first'}
          style={{ ...btn, opacity: exportReady ? 1 : 0.4, cursor: exportReady ? 'pointer' : 'not-allowed' }}
        >
          download mix .{ext}
        </button>
        <button
          data-testid="dj-export-meta"
          type="button"
          disabled={!receipt}
          onClick={onDownloadMeta}
          style={{ ...btn, opacity: receipt ? 1 : 0.4, cursor: receipt ? 'pointer' : 'not-allowed' }}
        >
          download metadata
        </button>
        <button
          type="button"
          data-testid="dj-copy-soundcloud"
          disabled={!receipt}
          onClick={onCopyReceipt}
          style={{ ...btn, opacity: receipt ? 1 : 0.4, cursor: receipt ? 'pointer' : 'not-allowed' }}
        >
          copy SoundCloud description
        </button>
        <a
          data-testid="dj-soundcloud-open"
          href={SOUNDCLOUD_UPLOAD}
          target="_blank"
          rel="noreferrer"
          style={{
            ...btn,
            textDecoration: 'none',
            display: 'inline-block',
            border: '1px solid rgba(255,155,94,0.35)',
            color: C.orange,
          }}
        >
          export ready for SoundCloud
        </a>
      </div>

      <p style={{ margin: '8px 0 0', fontFamily: 'monospace', fontSize: '0.32rem', letterSpacing: '0.06em', color: C.dim }}>
        manual upload · attach the file
      </p>

      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.3rem', letterSpacing: '0.3em', color: C.dim }}>
          CORS URL
        </span>
        <select
          value={urlSide}
          onChange={(e) => setUrlSide(e.target.value as 'left' | 'right')}
          style={{ ...btn, padding: '4px 6px' }}
        >
          <option value="left">Deck A</option>
          <option value="right">Deck B</option>
        </select>
        <input
          data-testid="dj-url-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… only if CORS allows"
          style={{
            flex: 1,
            minWidth: 160,
            background: '#0b0d10',
            border: '1px solid rgba(170,179,187,0.18)',
            color: C.text,
            fontFamily: 'monospace',
            fontSize: '0.4rem',
            padding: '6px 8px',
            borderRadius: 4,
          }}
        />
        <button
          data-testid="dj-url-load"
          type="button"
          onClick={() => url.trim() && onLoadUrl(urlSide, url.trim())}
          style={btn}
        >
          load url
        </button>
      </div>

      {error && (
        <p role="alert" style={{ margin: '8px 0 0', fontFamily: 'monospace', fontSize: '0.4rem', color: C.orange }}>
          {error}
        </p>
      )}

      {receipt && (
        <div
          data-testid="dj-mix-receipt"
          style={{
            marginTop: 12,
            padding: '10px 10px 8px',
            borderRadius: 6,
            background: '#0b0d10',
            border: '1px solid rgba(0,168,157,0.28)',
          }}
        >
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.32rem', letterSpacing: '0.4em', color: C.cyan }}>
            MIX RECEIPT
          </p>
          <h3 style={{ margin: '8px 0 4px', fontSize: '0.95rem', fontWeight: 500, color: C.text }}>{receipt.title}</h3>
          <p style={{ margin: '0 0 8px', fontFamily: 'monospace', fontSize: '0.38rem', color: C.sub }}>
            {receipt.date} · {receipt.mood}
          </p>
          <p style={{ margin: '0 0 10px', fontSize: '0.78rem', lineHeight: 1.5, color: C.sub }}>{receipt.description}</p>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.4rem',
              lineHeight: 1.55,
              color: C.text,
            }}
          >
            {`Tracklist\n${receipt.tracklist}\n\nTimestamps\n${receipt.timestamps}\n\nTags  ${receipt.tags.join(' · ')}\n\nSoundCloud caption\n${receipt.soundcloudCaption}\n\nCover prompt\n${receipt.coverPrompt}`}
          </pre>
        </div>
      )}
    </div>
  );
}
