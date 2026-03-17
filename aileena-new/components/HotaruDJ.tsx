'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Play, Pause, Search } from 'lucide-react';

const demoAlbums = [
  { id: 1, title: 'HOTARU 01', cover: 'https://picsum.photos/id/1015/300/300' },
  { id: 2, title: 'NEON VOID', cover: 'https://picsum.photos/id/201/300/300' },
  { id: 3, title: 'MACHINA 23', cover: 'https://picsum.photos/id/29/300/300' },
  { id: 4, title: 'CYBER RAIN', cover: 'https://picsum.photos/id/133/300/300' },
  { id: 5, title: 'AILEENA CUT', cover: 'https://picsum.photos/id/160/300/300' },
  { id: 6, title: 'SERATO 99', cover: 'https://picsum.photos/id/201/300/300' },
];

export default function HotaruDJ() {
  const [leftTrack, setLeftTrack] = useState<string | null>(null);
  const [rightTrack, setRightTrack] = useState<string | null>(null);
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  const [iframeSrc, setIframeSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAlbums, setFilteredAlbums] = useState(demoAlbums);

  const leftDeckRef = useRef<HTMLDivElement>(null);
  const rightDeckRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // GSAP floating + 5层glow
  useEffect(() => {
    gsap.to('.shelf-card', {
      y: -8,
      duration: 2.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }, []);

  const loadToDeck = (cover: string, deck: 'left' | 'right') => {
    if (deck === 'left') setLeftTrack(cover);
    else setRightTrack(cover);
  };

  const loadSoundCloud = () => {
    if (!soundcloudUrl) return;
    const embed = `https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&color=00ffea&auto_play=false`;
    setIframeSrc(embed);
    setIsPlaying(true);
    // glitch 效果
    document.getElementById('link-mode')?.classList.add('animate-pulse');
  };

  // 简单 waveform 实时响应（fallback 测试音频）
  useEffect(() => {
    if (isPlaying && waveformRef.current) {
      const canvas = waveformRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#00ffea';
        ctx.lineWidth = 2;
        let x = 0;
        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.beginPath();
          for (let i = 0; i < 50; i++) {
            const y = 30 + Math.random() * 40;
            ctx.lineTo(i * 8, y);
          }
          ctx.stroke();
          requestAnimationFrame(animate);
        };
        animate();
      }
    }
  }, [isPlaying]);

  // 搜索过滤
  useEffect(() => {
    setFilteredAlbums(demoAlbums.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-light tracking-widest text-white">DUAL HOTARU DJ v2.1</h2>
          <p className="text-sm text-white/50 mt-2">AILEENA x HOTARU x SERATO • EST 2025</p>
        </div>

        <div className="flex gap-8 flex-col lg:flex-row items-start justify-center">
          {/* LEFT DECK + 5层glow */}
          <div className="relative w-80 h-80 flex-shrink-0" ref={leftDeckRef}>
            <motion.div 
              className="w-80 h-80 rounded-full bg-black relative overflow-hidden"
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              style={{
                boxShadow: `
                  0 0 30px #00ffea,
                  0 0 60px #00ffea,
                  0 0 120px #00ffea,
                  0 0 180px #00ffea,
                  0 0 240px #00ffea
                `
              }}
            >
              {leftTrack && <img src={leftTrack} className="absolute inset-0 w-full h-full object-cover rounded-full" />}
            </motion.div>
            <div className="absolute -top-6 -right-6 text-xs uppercase tracking-widest text-white/70">LEFT DECK</div>
          </div>

          {/* CENTRAL CONTROL */}
          <div className="flex-1 max-w-md pt-12">
            <div className="glass p-8 border border-white/10 bg-black/70 relative">
              <div id="link-mode" className="hidden absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-4 py-1 text-xs text-[#00ffea] border border-[#00ffea] tracking-widest">LINK MODE ACTIVATED</div>
              
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={soundcloudUrl}
                  onChange={(e) => setSoundcloudUrl(e.target.value)}
                  placeholder="Paste SoundCloud / Hardwax link"
                  className="flex-1 bg-black border border-[#00ffea]/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#00ffea]"
                />
                <button onClick={loadSoundCloud} className="px-6 bg-[#00ffea] text-black font-bold text-sm hover:bg-white transition">LOAD TRACK</button>
              </div>

              {iframeSrc && <iframe width="100%" height="166" src={iframeSrc} className="rounded border border-[#00ffea]/20" />}

              {/* Waveform Canvas */}
              <canvas ref={waveformRef} width="320" height="80" className="mt-6 mx-auto block" />

              <div className="flex justify-center gap-6 text-sm mt-8">
                <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-2 hover:text-[#00ffea]">
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />} MASTER
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT DECK */}
          <div className="relative w-80 h-80 flex-shrink-0" ref={rightDeckRef}>
            <motion.div 
              className="w-80 h-80 rounded-full bg-black relative overflow-hidden"
              animate={{ rotate: isPlaying ? -360 : 0 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              style={{
                boxShadow: `
                  0 0 30px #00ffea,
                  0 0 60px #00ffea,
                  0 0 120px #00ffea,
                  0 0 180px #00ffea,
                  0 0 240px #00ffea
                `
              }}
            >
              {rightTrack && <img src={rightTrack} className="absolute inset-0 w-full h-full object-cover rounded-full" />}
            </motion.div>
            <div className="absolute -top-6 -left-6 text-xs uppercase tracking-widest text-white/70">RIGHT DECK</div>
          </div>
        </div>

        {/* VERTICAL ALBUM SHELF（Serato 风格） */}
        <div className="mt-20 border-t border-white/10 pt-12">
          <div className="flex justify-between items-center mb-6">
            <div className="uppercase text-xs tracking-[0.2em]">CRATE 001 — VERTICAL SHELF</div>
            <div className="flex items-center gap-3 text-sm">
              <Search size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="SEARCH CRATE..."
                className="bg-black border border-white/20 px-4 py-1 text-xs focus:border-[#00ffea]"
              />
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto pr-4 space-y-6 scrollbar-hide">
            {filteredAlbums.map((album) => (
              <motion.div
                key={album.id}
                drag
                onDragEnd={(_, info) => {
                  if (info.offset.x > 150) loadToDeck(album.cover, 'left');
                  if (info.offset.x < -150) loadToDeck(album.cover, 'right');
                }}
                whileHover={{ scale: 1.08, rotate: 3 }}
                className="shelf-card flex gap-6 items-center glass p-4 border border-white/10 hover:border-[#00ffea]/50 cursor-grab active:cursor-grabbing"
              >
                <img src={album.cover} className="w-24 h-24 object-cover border border-white/20" />
                <div className="flex-1">
                  <div className="font-medium text-lg text-white">{album.title}</div>
                </div>
                <button onClick={() => loadToDeck(album.cover, 'left')} className="text-xs border border-white/30 px-4 py-1 hover:bg-white hover:text-black">LEFT</button>
                <button onClick={() => loadToDeck(album.cover, 'right')} className="text-xs border border-white/30 px-4 py-1 hover:bg-white hover:text-black">RIGHT</button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
