'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import ScrollUnlock from '../../app/blog/ScrollUnlock';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import {
  SHOT_COUNT,
  SWIPE_COMMIT,
  captureFrame,
  composeSheet,
  downloadCanvas,
} from '../../lib/tools/photoautomat';
import './photoautomat.css';

type Phase = 'idle' | 'armed' | 'count' | 'flash' | 'develop' | 'print' | 'blocked';

export default function PhotoautomatTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.photoAutomat;
  const videoRef = useRef<HTMLVideoElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const dragRef = useRef(false);
  const dragValueRef = useRef(0);
  const liveRef = useRef(true);
  const [phase, setPhase] = useState<Phase>('idle');
  const [drag, setDrag] = useState(0);
  const [count, setCount] = useState<number | null>(null);
  const [shots, setShots] = useState(0);
  const [live, setLive] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
      stopStream();
    };
  }, [stopStream]);

  const openCamera = useCallback(async () => {
    if (streamRef.current) return streamRef.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('blocked');
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
        if (!video.videoWidth) {
          await new Promise<void>((resolve) => {
            const done = () => resolve();
            video.addEventListener('loadeddata', done, { once: true });
            window.setTimeout(done, 1200);
          });
        }
      }
      setLive(true);
      return stream;
    } catch {
      setPhase('blocked');
      return null;
    }
  }, []);

  const runSequence = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    framesRef.current = [];
    setShots(0);
    for (let n = 0; n < SHOT_COUNT && liveRef.current; n += 1) {
      for (const beat of [3, 2, 1]) {
        if (!liveRef.current) return;
        setPhase('count');
        setCount(beat);
        await new Promise((r) => window.setTimeout(r, 700));
      }
      if (!liveRef.current) return;
      setCount(null);
      setPhase('flash');
      await new Promise((r) => window.setTimeout(r, 90));
      framesRef.current.push(captureFrame(video));
      setShots(n + 1);
      setPhase('armed');
      await new Promise((r) => window.setTimeout(r, 420));
    }
    if (!liveRef.current) return;
    setPhase('develop');
    await new Promise((r) => window.setTimeout(r, 1400));
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
  }, [stopStream]);

  const startBooth = useCallback(async () => {
    setDrag(1);
    const stream = await openCamera();
    if (!stream) {
      setDrag(0);
      return;
    }
    setPhase('armed');
    await runSequence();
  }, [openCamera, runSequence]);

  function pointerPos(clientX: number) {
    const slot = slotRef.current;
    if (!slot) return 0;
    const rect = slot.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (phase !== 'idle' && phase !== 'blocked') return;
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
    await downloadCanvas(canvas, 'photoautomat-sheet.png');
  }

  function onAgain() {
    framesRef.current = [];
    setShots(0);
    setCount(null);
    setDrag(0);
    setPhase('idle');
    setSheetUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  const status =
    phase === 'blocked'
      ? tx.blocked
      : phase === 'develop'
        ? tx.developing
        : phase === 'count' || phase === 'flash' || phase === 'armed'
          ? tx.shooting
          : phase === 'print'
            ? tx.take
            : tx.swipe;

  return (
    <div className="foto-root" data-testid="foto-root">
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
          <video
            ref={videoRef}
            className={`foto-video${live ? ' is-live' : ''}`}
            muted
            playsInline
            autoPlay
            data-testid="foto-video"
          />
          <span className={`foto-lamp${phase === 'count' || phase === 'flash' ? ' is-hot' : ''}`} />
          <div className={`foto-flash${phase === 'flash' ? ' is-on' : ''}`} />
          {count != null ? <div className="foto-count">{count}</div> : null}
          {phase !== 'idle' ? (
            <p className="foto-status" data-testid="foto-status">
              {status}
              {shots ? ` · ${shots}/${SHOT_COUNT}` : ''}
            </p>
          ) : null}
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
              disabled={phase !== 'idle' && phase !== 'blocked'}
            >
              {tx.swipe}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
