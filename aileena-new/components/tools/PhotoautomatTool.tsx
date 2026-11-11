'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import ScrollUnlock from '../../app/blog/ScrollUnlock';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import {
  COUNT_BEAT_MS,
  DEVELOP_MS,
  FLASH_MS,
  POSE_GAP_MS,
  SHOT_COUNT,
  SWIPE_COMMIT,
  attachCameraStream,
  captureFrame,
  composeSheet,
  downloadCanvas,
  requestUserCamera,
  simulationFrame,
  squareCrop,
  applyFilmStill,
} from '../../lib/tools/photoautomat';
import './photoautomat.css';

type Phase = 'idle' | 'ready' | 'armed' | 'count' | 'flash' | 'develop' | 'print' | 'blocked';

export default function PhotoautomatTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.photoAutomat;
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const dragRef = useRef(false);
  const dragValueRef = useRef(0);
  const liveRef = useRef(true);
  const gradedOnce = useRef(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [drag, setDrag] = useState(0);
  const [count, setCount] = useState<number | null>(null);
  const [shots, setShots] = useState(0);
  const [live, setLive] = useState(false);
  const [graded, setGraded] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const showFrame = useCallback((frame: HTMLCanvasElement) => {
    const preview = previewRef.current;
    const ctx = preview?.getContext('2d');
    if (!preview || !ctx) return;
    if (preview.width !== frame.width || preview.height !== frame.height) {
      preview.width = frame.width;
      preview.height = frame.height;
    }
    ctx.drawImage(frame, 0, 0);
    if (!gradedOnce.current) {
      gradedOnce.current = true;
      setGraded(true);
    }
  }, []);

  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    if (!live) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last > 48) {
        last = now;
        const video = videoRef.current;
        const preview = previewRef.current;
        if (video && preview && video.readyState >= 2 && video.videoWidth > 0) {
          const crop = squareCrop(video.videoWidth, video.videoHeight);
          const side = 320;
          if (preview.width !== side || preview.height !== side) {
            preview.width = side;
            preview.height = side;
          }
          const ctx = preview.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.save();
            ctx.translate(side, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, side, side);
            ctx.restore();
            const image = ctx.getImageData(0, 0, side, side);
            applyFilmStill(image.data, side, side);
            ctx.putImageData(image, 0, 0);
            if (!gradedOnce.current) {
              gradedOnce.current = true;
              setGraded(true);
            }
          }
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [live]);

  const openCamera = useCallback(async () => {
    if (streamRef.current) return streamRef.current;
    try {
      const stream = await requestUserCamera();
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) await attachCameraStream(video, stream);
      setLive(true);
      setPhase('ready');
      return stream;
    } catch {
      setPhase('blocked');
      setLive(false);
      return null;
    }
  }, []);

  async function onAllow() {
    await openCamera();
  }

  const runningRef = useRef(false);

  const runSequence = useCallback(async (mode: 'camera' | 'simulate') => {
    if (runningRef.current) return;
    const video = videoRef.current;
    if (mode === 'camera' && !video) return;
    runningRef.current = true;
    try {
      framesRef.current = [];
      setShots(0);
      for (let n = 0; n < SHOT_COUNT && liveRef.current; n += 1) {
        for (const beat of [3, 2, 1]) {
          if (!liveRef.current) return;
          setPhase('count');
          setCount(beat);
          if (mode === 'simulate') showFrame(simulationFrame(n, (beat - 2) * 0.35, 640));
          await new Promise((r) => window.setTimeout(r, COUNT_BEAT_MS));
        }
        if (!liveRef.current) return;
        setCount(null);
        setPhase('flash');
        await new Promise((r) => window.setTimeout(r, FLASH_MS));
        const frame = mode === 'simulate' ? simulationFrame(n, 0, 720) : captureFrame(video!);
        framesRef.current.push(frame);
        if (mode === 'simulate') showFrame(frame);
        setShots(n + 1);
        setPhase('armed');
        await new Promise((r) => window.setTimeout(r, POSE_GAP_MS));
      }
      if (!liveRef.current) return;
      setPhase('develop');
      await new Promise((r) => window.setTimeout(r, DEVELOP_MS));
      const sheet = composeSheet(framesRef.current);
      const blob = await new Promise<Blob | null>((resolve) => sheet.toBlob(resolve, 'image/png'));
      if (!blob || !liveRef.current) return;
      setSheetUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setPhase('print');
      setLive(false);
      stopStream();
    } finally {
      runningRef.current = false;
    }
  }, [showFrame, stopStream]);

  const startBooth = useCallback(async () => {
    if (!streamRef.current) {
      setDrag(0);
      return;
    }
    setDrag(1);
    setPhase('armed');
    await runSequence('camera');
  }, [runSequence]);

  const startSimulation = useCallback(async () => {
    setPhase('armed');
    await runSequence('simulate');
  }, [runSequence]);

  function pointerPos(clientX: number) {
    const slot = slotRef.current;
    if (!slot) return 0;
    const rect = slot.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (phase !== 'ready') return;
    dragRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = pointerPos(event.clientX);
    dragValueRef.current = next;
    setDrag(next);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragRef.current) return;
    const next = pointerPos(event.clientX);
    dragValueRef.current = next;
    setDrag(next);
  }

  function onPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = false;
    if (dragValueRef.current >= SWIPE_COMMIT) void startBooth();
    else {
      dragValueRef.current = 0;
      setDrag(0);
    }
  }

  async function onDownload() {
    if (!sheetUrl) return;
    const image = new Image();
    image.src = sheetUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(image, 0, 0);
    await downloadCanvas(canvas, 'photoautomat-strip.png');
  }

  function onAgain() {
    framesRef.current = [];
    setShots(0);
    setCount(null);
    setDrag(0);
    setLive(false);
    gradedOnce.current = false;
    setGraded(false);
    setPhase('idle');
    stopStream();
    setSheetUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  const shooting = phase === 'count' || phase === 'flash' || phase === 'armed';
  const status =
    phase === 'blocked'
      ? tx.blocked
      : phase === 'develop'
        ? tx.developing
        : shooting
          ? tx.shooting
          : phase === 'print'
            ? tx.take
            : phase === 'ready'
              ? tx.swipe
              : tx.allow;

  return (
    <div className="foto-root" data-testid="foto-root" data-phase={phase} data-live={live ? 'yes' : 'no'}>
      <ScrollUnlock />
      <div className="foto-top">
        <Link href="/tools" className="foto-back">
          {tx.backToTools}
        </Link>
        <span className="foto-tag">{tx.tag}</span>
      </div>

      {phase === 'print' && sheetUrl ? (
        <div className="foto-print" data-testid="foto-print">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="foto-sheet" src={sheetUrl} alt="" />
          <div className="foto-actions">
            <button type="button" data-testid="foto-download" onClick={() => void onDownload()}>
              {tx.download}
            </button>
            <button type="button" data-testid="foto-again" onClick={onAgain}>
              {tx.again}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="foto-cabin"
          data-testid="foto-cabin"
          style={{ backgroundImage: "url('/tools/photoautomat/interior.jpg')" }}
        >
          <div className="foto-glass">
            <video
              ref={videoRef}
              className={`foto-video${live && !graded ? ' is-live' : ''}`}
              muted
              playsInline
              autoPlay
              data-testid="foto-video"
              data-live={live ? 'yes' : 'no'}
            />
            <canvas
              ref={previewRef}
              className={`foto-preview${graded ? ' is-on' : ''}`}
              data-testid="foto-preview"
            />
            {phase === 'idle' || phase === 'blocked' ? (
              <div className="foto-gates">
                <button
                  type="button"
                  className={`foto-allow${phase === 'blocked' ? ' is-blocked' : ''}`}
                  data-testid="foto-allow"
                  onClick={() => {
                    void onAllow();
                  }}
                >
                  {phase === 'blocked' ? tx.blocked : tx.allow}
                </button>
                <button
                  type="button"
                  className="foto-sim"
                  data-testid="foto-simulate"
                  onClick={() => {
                    void startSimulation();
                  }}
                >
                  {tx.simulate}
                </button>
              </div>
            ) : null}
            {count != null ? <div className="foto-count">{count}</div> : null}
          </div>
          <div className={`foto-flash${phase === 'flash' ? ' is-on' : ''}`} />
          {shooting || phase === 'develop' ? (
            <p className="foto-status" data-testid="foto-status">
              {status}
              {shots ? ` · ${shots}/${SHOT_COUNT}` : ''}
            </p>
          ) : null}
          {live ? (
            <div ref={slotRef} className="foto-slot" data-testid="foto-slot">
              <button
                type="button"
                className="foto-card"
                data-testid="foto-card"
                style={{ transform: `translateX(${Math.round(drag * 108)}%)` }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                disabled={phase !== 'ready'}
              >
                {tx.swipe}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
