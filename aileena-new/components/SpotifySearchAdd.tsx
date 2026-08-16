'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SpotifySearchTrack } from '../lib/spotifySearchShared';

type Status = 'loading' | 'ready' | 'missing' | 'error';

const FALLBACK_ART =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='80'%20height='80'%3E%3Crect%20width='80'%20height='80'%20fill='%2312161b'/%3E%3C/svg%3E";

function fmtDur(ms: number): string {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function SpotifySearchAdd({
  existingIds,
  onAdd,
}: {
  existingIds: Set<string>;
  onAdd: (hit: SpotifySearchTrack) => 'added' | 'duplicate';
}) {
  const [configured, setConfigured] = useState<Status>('loading');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SpotifySearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/spotify/status')
      .then((r) => r.json())
      .then((body: { configured?: boolean }) => {
        if (cancelled) return;
        setConfigured(body.configured ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setConfigured('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      previewRef.current?.pause();
    };
  }, []);

  function runSearch(term: string) {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setSearching(true);
    setSearchError(null);
    setOpen(true);
    fetch(`/api/spotify/search?q=${encodeURIComponent(term)}`, { signal: ac.signal })
      .then(async (r) => {
        const body = (await r.json()) as {
          ok?: boolean;
          data?: { tracks?: SpotifySearchTrack[] };
          error?: { code?: string; message?: string };
        };
        if (!r.ok || body.ok === false) {
          if (body.error?.code === 'not_configured') {
            setConfigured('missing');
            setHits([]);
            return;
          }
          throw new Error(body.error?.message || 'search failed');
        }
        setHits(body.data?.tracks ?? []);
        setOpen(true);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setSearchError('Spotify search failed. Try again shortly.');
        setHits([]);
        setOpen(true);
      })
      .finally(() => setSearching(false));
  }

  function onQuery(next: string) {
    setQ(next);
    setNotice(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = next.trim();
    if (term.length < 2) {
      abortRef.current?.abort();
      setHits([]);
      setSearching(false);
      setSearchError(null);
      setOpen(false);
      return;
    }
    setSearching(true);
    setOpen(true);
    debounceRef.current = setTimeout(() => runSearch(term), 380);
  }

  function addHit(hit: SpotifySearchTrack) {
    const result = onAdd(hit);
    if (result === 'duplicate') {
      setNotice('already in carousel');
      return;
    }
    setNotice(`added “${hit.title}” · reference only`);
    setOpen(false);
  }

  function playPreview(url: string) {
    if (!previewRef.current) previewRef.current = new Audio();
    const el = previewRef.current;
    if (el.src === url && !el.paused) {
      el.pause();
      return;
    }
    el.src = url;
    void el.play().catch(() => {
      setNotice('preview blocked — use Open in Spotify');
    });
  }

  const disabled = configured !== 'ready';

  return (
    <div
      data-testid="spotify-search"
      data-spotify-configured={configured}
      style={{
        position: 'relative',
        marginTop: 14,
        padding: '12px 12px 10px',
        borderRadius: 8,
        background: '#12161b',
        border: '1px solid rgba(170,179,187,0.12)',
      }}
    >
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: 15,
          letterSpacing: '0.04em',
          color: '#fffdf8',
          margin: '0 0 8px',
        }}
      >
        Search Spotify · reference tracks only
      </p>
      <input
        data-testid="spotify-search-input"
        type="search"
        value={q}
        disabled={disabled}
        onChange={(e) => onQuery(e.target.value)}
        onFocus={() => {
          if (hits.length || searchError) setOpen(true);
        }}
        placeholder="search Spotify to add a track"
        aria-label="Search Spotify to add a track"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 44,
          padding: '10px 12px',
          borderRadius: 4,
          border: '1px solid rgba(0,168,157,0.28)',
          background: disabled ? 'rgba(0,0,0,0.35)' : '#0b0d10',
          color: '#fffdf8',
          fontFamily: 'monospace',
          fontSize: 16,
          outline: 'none',
        }}
      />
      {configured === 'missing' && (
        <p data-testid="spotify-search-disabled" style={hintStyle}>
          Spotify search is not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET, then redeploy.
        </p>
      )}
      {configured === 'error' && (
        <p style={hintStyle}>Spotify search is down.</p>
      )}
      {notice && (
        <p data-testid="spotify-search-notice" role="status" style={{ ...hintStyle, color: '#00a89d' }}>
          {notice}
        </p>
      )}

      {open && configured === 'ready' && (
        <div
          data-testid="spotify-search-results"
          style={{
            position: 'relative',
            marginTop: 8,
            maxHeight: 280,
            overflowY: 'auto',
            background: '#0b0d10',
            border: '1px solid rgba(0,168,157,0.28)',
            borderRadius: 6,
          }}
        >
          {searching && (
            <p data-testid="spotify-search-loading" style={{ ...rowHint, color: 'rgba(255,253,248,0.5)' }}>searching…</p>
          )}
          {!searching && searchError && (
            <p style={{ ...rowHint, color: '#ff9b5e' }}>{searchError}</p>
          )}
          {!searching && !searchError && hits.length === 0 && (
            <p data-testid="spotify-search-empty" style={rowHint}>no tracks</p>
          )}
          {!searching &&
            hits.map((hit) => {
              const inLib = existingIds.has(hit.spotifyId.toLowerCase());
              return (
                <div
                  key={hit.spotifyId}
                  data-testid="spotify-search-hit"
                  data-spotify-id={hit.spotifyId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr auto',
                    gap: 10,
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderBottom: '1px solid rgba(255,253,248,0.06)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hit.albumArt || FALLBACK_ART}
                    alt=""
                    width={40}
                    height={40}
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: 'cover',
                      borderRadius: 2,
                      background: '#12161b',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'monospace',
                        fontSize: 14,
                        color: '#fffdf8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {hit.title}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        color: 'rgba(255,253,248,0.45)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {hit.artists.join(', ') || '—'}
                      {hit.durationMs ? ` · ${fmtDur(hit.durationMs)}` : ''}
                      {hit.previewUrl ? '' : ' · no preview'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {hit.previewUrl ? (
                      <button
                        type="button"
                        data-testid="spotify-search-preview"
                        onClick={() => playPreview(hit.previewUrl!)}
                        style={miniBtn}
                      >
                        preview
                      </button>
                    ) : (
                      <a
                        href={hit.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="spotify-search-open"
                        style={{ ...miniBtn, textDecoration: 'none' }}
                      >
                        open
                      </a>
                    )}
                    <button
                      type="button"
                      data-testid="spotify-search-add"
                      data-already-in={inLib ? 'true' : 'false'}
                      onClick={() => addHit(hit)}
                      style={{
                        ...miniBtn,
                        borderColor: inLib ? 'rgba(255,253,248,0.12)' : 'rgba(0,168,157,0.45)',
                        color: inLib ? 'rgba(255,253,248,0.35)' : '#00a89d',
                      }}
                    >
                      {inLib ? 'added' : 'add'}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

const hintStyle: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'monospace',
  fontSize: 13,
  letterSpacing: '0.02em',
  color: 'rgba(255,253,248,0.62)',
  lineHeight: 1.4,
};

const rowHint: CSSProperties = {
  margin: 0,
  padding: '12px 10px',
  fontFamily: 'monospace',
  fontSize: 14,
  color: 'rgba(255,253,248,0.55)',
};

const miniBtn: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 13,
  letterSpacing: '0.04em',
  padding: '8px 10px',
  minHeight: 44,
  borderRadius: 4,
  border: '1px solid rgba(170,179,187,0.22)',
  background: 'transparent',
  color: 'rgba(255,253,248,0.7)',
  cursor: 'pointer',
};
