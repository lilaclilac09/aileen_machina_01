'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  COUNTDOWN_FROM,
  FRAME_COUNT,
  PRINT,
  applyBlackAndWhite,
  cameraErrorMessage,
  drawMirroredSquare,
  isSwipeCommit,
  paintFourGrid,
  sessionTiming,
  type BoothPhase,
} from '../../lib/tools/photoAutomat';
import './photo-automat.css';

const EMPTY_THUMBS: Array<string | null> = [null, null, null, null];

function wait(ms: number, alive: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (!alive()) reject(new DOMException('aborted', 'AbortError'));
      else resolve();
    }, ms);
  });
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

async function openUserCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('Unsupported'), { name: 'NotSupportedError' });
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    });
  } catch (err) {
    const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : '';
    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    throw err;
  }
}

export default function PhotoAutomatBooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const framesRef = useRef<Array<HTMLCanvasElement | null>>([null, null, null, null]);
  const runRef = useRef(0);
  const busyRef = useRef(false);
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const [phase, setPhase] = useState<BoothPhase>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [thumbs, setThumbs] = useState<Array<string | null>>(EMPTY_THUMBS);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardShift, setCardShift] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [fast, setFast] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFast(new URLSearchParams(window.location.search).get('qa') === '1');
    setReady(true);
  }, []);

  const resetPrint = useCallback(() => {
    setPrintUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const releaseCamera = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  useEffect(() => {
    return () => {
      runRef.current += 1;
      releaseCamera();
      if (printUrl) URL.revokeObjectURL(printUrl);
    };
    // unmount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureFrame = useCallback((video: HTMLVideoElement): HTMLCanvasElement | null => {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;
    const canvas = document.createElement('canvas');
    canvas.width = PRINT.cell;
    canvas.height = PRINT.cell;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    drawMirroredSquare(ctx, video, PRINT.cell, width, height);
    const image = ctx.getImageData(0, 0, PRINT.cell, PRINT.cell);
    applyBlackAndWhite(image.data);
    ctx.putImageData(image, 0, 0);
    return canvas;
  }, []);

  const composePrint = useCallback((frames: Array<HTMLCanvasElement | null>, alive: () => boolean) => {
    const sheet = document.createElement('canvas');
    const ctx = sheet.getContext('2d');
    if (!ctx) return;
    paintFourGrid(ctx, frames);
    sheet.toBlob((blob) => {
      if (!blob || !alive()) return;
      resetPrint();
      setPrintUrl(URL.createObjectURL(blob));
      setPhase('print');
    }, 'image/png');
  }, [resetPrint]);

  const startSession = useCallback(async () => {
    if (phase === 'requesting' || phase === 'live' || busyRef.current) return;
    busyRef.current = true;
    const run = ++runRef.current;
    const alive = () => runRef.current === run;
    const timing = sessionTiming(fast);

    resetPrint();
    framesRef.current = [null, null, null, null];
    setThumbs(EMPTY_THUMBS);
    setError(null);
    setCountdown(null);
    setFlash(false);
    setCardShift({ x: 0, y: 0 });
    setPhase('requesting');
    releaseCamera();

    try {
      const stream = await openUserCamera();
      if (!alive()) {
        stopStream(stream);
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('No viewfinder');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      if (video.readyState < 2) {
        await new Promise<void>((resolve, reject) => {
          const timer = window.setTimeout(() => reject(new Error('Camera preview failed')), 8000);
          const ok = () => {
            window.clearTimeout(timer);
            resolve();
          };
          const fail = () => {
            window.clearTimeout(timer);
            reject(new Error('Camera preview failed'));
          };
          video.addEventListener('loadeddata', ok, { once: true });
          video.addEventListener('error', fail, { once: true });
        });
      }
      if (!alive()) return;
      setPhase('live');

      for (let i = 0; i < FRAME_COUNT; i += 1) {
        for (let n = COUNTDOWN_FROM; n >= 1; n -= 1) {
          if (!alive()) return;
          setCountdown(n);
          await wait(timing.tickMs, alive);
        }
        if (!alive()) return;
        setCountdown(null);
        setFlash(true);
        const frame = captureFrame(video);
        if (frame) {
          framesRef.current[i] = frame;
          const url = frame.toDataURL('image/jpeg', 0.84);
          setThumbs((prev) => {
            const next = [...prev];
            next[i] = url;
            return next;
          });
        }
        await wait(timing.flashMs, alive);
        setFlash(false);
        await wait(timing.gapMs, alive);
      }

      if (!alive()) return;
      releaseCamera();
      composePrint(framesRef.current, alive);
      busyRef.current = false;
    } catch (err) {
      if (!alive()) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      releaseCamera();
      setCountdown(null);
      setFlash(false);
      setError(cameraErrorMessage(err));
      setPhase('error');
      busyRef.current = false;
    }
  }, [captureFrame, composePrint, fast, phase, releaseCamera, resetPrint]);

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      setDragging(false);
      const dx = clientX - drag.x;
      const dy = clientY - drag.y;
      if (isSwipeCommit(dx, dy)) {
        setCardShift({ x: 0, y: 140 });
        void startSession();
        return;
      }
      setCardShift({ x: 0, y: 0 });
    },
    [startSession],
  );

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (phase === 'requesting' || phase === 'live') return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* capture is optional; window listeners still track the swipe */
    }
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== event.pointerId) return;
      setCardShift({ x: event.clientX - drag.x, y: event.clientY - drag.y });
    };
    const onUp = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== event.pointerId) return;
      finishDrag(event.clientX, event.clientY);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, finishDrag]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"], [role="dialog"]')) return;
      if (phase === 'requesting' || phase === 'live') return;
      event.preventDefault();
      void startSession();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, startSession]);

  const showVideo = phase === 'live' || phase === 'requesting';
  const hint =
    phase === 'live'
      ? 'Hold still'
      : phase === 'requesting'
        ? 'Opening camera'
        : phase === 'print'
          ? 'Swipe the card to retake'
          : 'Swipe the card · Space or Enter';

  return (
    <div
      className="pa-root"
      data-testid="photo-automat-booth"
      data-phase={phase}
      data-ready={ready ? '1' : '0'}
    >
      <Link href="/tools" className="pa-back">
        ← Tools
      </Link>

      <div className="pa-stage">
        <div className="pa-curtain pa-curtain--left" aria-hidden />

        <section className="pa-cabinet" aria-label="Photo Automat booth">
          <h1 className="pa-title">
            <span className="pa-title-main">Photo Automat</span>
            <span className="pa-title-sub">· Berlin ·</span>
          </h1>

          <div className="pa-finder" data-testid="photo-automat-finder">
            {phase === 'print' && printUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="pa-finder-print"
                src={printUrl}
                alt="2 by 2 black and white Photo Automat sheet"
                data-testid="photo-automat-print"
              />
            ) : !showVideo ? (
              <div className="pa-room" aria-hidden>
                <span className="pa-room-wall" />
                <span className="pa-room-light" />
              </div>
            ) : null}
            <video
              ref={videoRef}
              className="pa-finder-video"
              playsInline
              muted
              autoPlay
              style={{ opacity: showVideo ? 1 : 0 }}
            />
            {countdown != null ? (
              <div className="pa-countdown" data-testid="photo-automat-countdown" aria-live="polite">
                {countdown}
              </div>
            ) : null}
            {flash ? <div className="pa-flash" data-testid="photo-automat-flash" /> : null}
            {phase === 'requesting' ? (
              <div className="pa-finder-msg">Opening camera…</div>
            ) : null}
            {phase === 'error' && error ? (
              <div className="pa-finder-msg" role="alert" data-testid="photo-automat-error">
                {error}
              </div>
            ) : null}
          </div>

          <div className="pa-slot" data-testid="photo-automat-slot">
            <span className="pa-slot-lip" aria-hidden />
            <button
              type="button"
              className="pa-card"
              data-testid="photo-automat-card"
              aria-label="Swipe card to start"
              disabled={phase === 'requesting' || phase === 'live'}
              style={{
                transform: `translate(${cardShift.x}px, ${cardShift.y}px)`,
                transition: dragging ? 'none' : 'transform 180ms ease',
              }}
              onPointerDown={onPointerDown}
              onClick={() => {
                if (dragging || dragRef.current) return;
                void startSession();
              }}
            >
              <span className="pa-card-brand">Photo Automat</span>
              <span className="pa-card-city">Berlin</span>
              <span className="pa-card-stripe" aria-hidden />
            </button>
          </div>

          <p className="pa-hint">{hint}</p>
          {phase === 'print' && printUrl ? (
            <div className="pa-actions">
              <a href={printUrl} download="photo-automat-berlin.png" data-testid="photo-automat-download">
                Download
              </a>
              <button type="button" data-testid="photo-automat-retake" onClick={() => void startSession()}>
                Retake
              </button>
            </div>
          ) : null}
          <p className="pa-privacy">Photos stay on this device. Nothing is uploaded.</p>
        </section>

        <ol className="pa-strip" aria-label="Four frames">
          {thumbs.map((src, i) => (
            <li
              key={i}
              className="pa-frame"
              data-testid={`photo-automat-frame-${i}`}
              data-filled={src ? '1' : '0'}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={`Frame ${i + 1}`} />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="pa-curtain pa-curtain--right" aria-hidden />
      </div>
    </div>
  );
}
