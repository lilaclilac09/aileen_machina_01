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
  padding: '10px 14px',
  minHeight: 44,
  borderRadius: 4,
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 14,
  letterSpacing: '0.04em',
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
        marginTop: 12,
        borderRadius: 10,
        padding: '12px 12px',
        background: C.panel,
        border: '1px solid rgba(170,179,187,0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.08em', color: C.text }}>
          Record
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: C.sub }}>
          Records the mix · {ext}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
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
          {recording ? `Stop  ${fmt}` : 'Record'}
        </button>
        <button
          data-testid="dj-export-audio"
          type="button"
          disabled={!exportReady}
          onClick={onDownloadAudio}
          title={exportReady ? `Export .${ext}` : 'Record first'}
          style={{ ...btn, opacity: exportReady ? 1 : 0.4, cursor: exportReady ? 'pointer' : 'not-allowed' }}
        >
          Export
        </button>
        <button
          data-testid="dj-export-meta"
          type="button"
          disabled={!receipt}
          onClick={onDownloadMeta}
          style={{ ...btn, opacity: receipt ? 1 : 0.4, cursor: receipt ? 'pointer' : 'not-allowed' }}
        >
          Meta
        </button>
        <button
          type="button"
          data-testid="dj-copy-soundcloud"
          disabled={!receipt}
          onClick={onCopyReceipt}
          style={{ ...btn, opacity: receipt ? 1 : 0.4, cursor: receipt ? 'pointer' : 'not-allowed' }}
        >
          Copy
        </button>
        <a
          data-testid="dj-soundcloud-open"
          href={SOUNDCLOUD_UPLOAD}
          target="_blank"
          rel="noreferrer"
          style={{
            ...btn,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid rgba(255,155,94,0.35)',
            color: C.orange,
          }}
        >
          SoundCloud
        </a>
      </div>

      <details style={{ marginTop: 12 }}>
        <summary
          style={{
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 13,
            color: C.sub,
            listStyle: 'none',
          }}
        >
          Load URL
        </summary>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={urlSide}
            onChange={(e) => setUrlSide(e.target.value as 'left' | 'right')}
            style={{ ...btn, padding: '8px 10px' }}
          >
            <option value="left">Deck A</option>
            <option value="right">Deck B</option>
          </select>
          <input
            data-testid="dj-url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            style={{
              flex: 1,
              minWidth: 160,
              minHeight: 44,
              background: '#0b0d10',
              border: '1px solid rgba(170,179,187,0.18)',
              color: C.text,
              fontFamily: 'monospace',
              fontSize: 16,
              padding: '8px 10px',
              borderRadius: 4,
            }}
          />
          <button
            data-testid="dj-url-load"
            type="button"
            onClick={() => url.trim() && onLoadUrl(urlSide, url.trim())}
            style={btn}
          >
            Load
          </button>
        </div>
      </details>

      {error && (
        <p role="alert" style={{ margin: '10px 0 0', fontFamily: 'monospace', fontSize: 14, color: C.orange }}>
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
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.2em', color: C.cyan }}>
            MIX RECEIPT
          </p>
          <h3 style={{ margin: '8px 0 4px', fontSize: 16, fontWeight: 500, color: C.text }}>{receipt.title}</h3>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, color: C.sub }}>
            {receipt.date} · {receipt.mood}
          </p>
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: 13, color: C.sub }}>
              Details
            </summary>
            <pre
              style={{
                margin: '8px 0 0',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.5,
                color: C.text,
              }}
            >
              {`Tracklist\n${receipt.tracklist}\n\nTimestamps\n${receipt.timestamps}\n\nTags  ${receipt.tags.join(' · ')}\n\nSoundCloud caption\n${receipt.soundcloudCaption}\n\nCover prompt\n${receipt.coverPrompt}`}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
