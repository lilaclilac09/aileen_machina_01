'use client';

import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

interface Fortune {
  text: string;
  number: string;
}

export default function GestureDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [isCracked, setIsCracked] = useState(false);
  const [status, setStatus] = useState('点击「开始手势模式」');

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const wasCloseRef = useRef(false);

  const [fortunes, setFortunes] = useState<Fortune[]>([]);
  useEffect(() => {
    fetch('/fortunes.json')
      .then(res => res.json())
      .then(data => setFortunes(data));
  }, []);

  const initGesture = async () => {
    setStatus('初始化 MediaPipe...');
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
      runningMode: 'VIDEO',
      numHands: 2
    });

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', startPrediction);
    }
    setStatus('✅ 摄像头已开启！双手靠近再拉开试试');
  };

  const startPrediction = () => {
    if (!handLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    const predict = () => {
      if (!videoRef.current || !handLandmarkerRef.current) return;

      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, Date.now());

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      canvasCtx.drawImage(videoRef.current, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

      let currentClose = false;

      if (results.landmarks && results.landmarks.length >= 2) {
        const drawingUtils = new DrawingUtils(canvasCtx);
        results.landmarks.forEach((landmarks) => {
          drawingUtils.drawConnectors(landmarks, [], { color: '#FF9800', lineWidth: 2 });
          const wrist = landmarks[0];
          canvasCtx.fillStyle = '#FF9800';
          canvasCtx.beginPath();
          canvasCtx.arc(wrist.x * canvasRef.current!.width, wrist.y * canvasRef.current!.height, 8, 0, 2 * Math.PI);
          canvasCtx.fill();
        });

        const leftWrist = results.landmarks[0][0];
        const rightWrist = results.landmarks[1][0];
        const distance = Math.sqrt(
          Math.pow(leftWrist.x - rightWrist.x, 2) + Math.pow(leftWrist.y - rightWrist.y, 2)
        );

        currentClose = distance < 0.25;

        if (wasCloseRef.current && !currentClose && distance > 0.4) {
          crackCookie();
        }
      }

      wasCloseRef.current = currentClose;
      animationRef.current = requestAnimationFrame(predict);
    };

    predict();
  };

  const crackCookie = () => {
    if (isCracked || fortunes.length === 0) return;

    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    setFortune(randomFortune);
    setIsCracked(true);
    setStatus('🎉 饼干裂开了！');

    setTimeout(() => {
      setIsCracked(false);
      setFortune(null);
      setStatus('继续玩！双手靠近再拉开');
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px', background: '#fffaf0', borderRadius: '15px' }}>
      <h2>🍪 手势开幸运饼干（对着镜头玩）</h2>
      <button onClick={initGesture} style={{ padding: '10px 20px', fontSize: '1.2em', marginBottom: '10px' }}>
        开始手势模式
      </button>

      <p>{status}</p>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          width="480"
          height="360"
          style={{ borderRadius: '12px', display: isCracked ? 'none' : 'block' }}
        />
        <canvas
          ref={canvasRef}
          width="480"
          height="360"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: '12px',
            display: isCracked ? 'none' : 'block'
          }}
        />
      </div>

      {isCracked && fortune && (
        <div style={{ marginTop: '20px', fontSize: '2em', color: '#d32f2f', animation: 'pop 0.5s' }}>
          🎉 你的幸运号码是 <strong>{fortune.number}</strong><br />
          {fortune.text}
        </div>
      )}

      {isCracked && (
        <button onClick={() => { setIsCracked(false); setFortune(null); }} style={{ marginTop: '10px' }}>
          再抽一次
        </button>
      )}
    </div>
  );
}
