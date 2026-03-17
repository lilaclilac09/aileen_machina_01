'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import HotaruDJ from '../components/HotaruDJ';

export default function Home() {
  const [showLeftNav, setShowLeftNav] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      setShowLeftNav(window.scrollY > 600);
      if (window.scrollY > 1200) setCurrentPage(2);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Header />
      <HotaruDJ />

      {/* ===== 第一页：Hero（只在这里用 04.jpeg 背景） ===== */}
      <section className="min-h-screen flex items-center justify-center relative pt-24 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-[-1]"
          style={{ backgroundImage: "url('/bg_pic/04.jpeg')" }}
        />
        <div className="text-center z-10">
          <h1 className="text-7xl font-light tracking-[0.2em] text-white">AILEENA</h1>
          <p className="mt-6 text-xl text-white/70">MACHINA • 01 • EST 2025</p>
        </div>
      </section>

      {/* 左侧垂直 Nav（滚动后出现，白色极简） */}
      <AnimatePresence>
        {showLeftNav && (
          <motion.nav
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed left-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-8 text-sm uppercase tracking-widest text-white/80"
          >
            <a href="#gallery" className="hover:text-[#00ffea] transition">GALLERY</a>
            <a href="#sound" className="hover:text-[#00ffea] transition">SOUND</a>
            <a href="#blog" className="hover:text-[#00ffea] transition">BLOG</a>
            <a href="https://mev.aileena.xyz" target="_blank" className="hover:text-[#00ffea] transition">CHAIN</a>
            <a href="#works" className="hover:text-[#00ffea] transition">WORKS</a>
            <a href="#elsewhere" className="hover:text-[#00ffea] transition">ELSEWHERE</a>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ===== 第二页：DJ盘页面（背景完全独立，不用04） ===== */}
      <motion.section
        id="dj"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: currentPage === 2 ? 1 : 0, y: currentPage === 2 ? 0 : 100 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="min-h-screen relative bg-black"
      >
        <HotaruDJ />
      </motion.section>
    </>
  );
}