// Nav Flip Page Toggle
const navTrigger = document.getElementById('menuToggle');
const navPage = document.getElementById('navPage');

function openNavPage() {
  navPage.classList.add('active');
  gsap.fromTo('.nav-list li', 
    { y: 50, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
  );
}

function closeNavPage() {
  gsap.to('.nav-list li', {
    y: -30, opacity: 0, duration: 0.5, stagger: 0.1,
    onComplete: () => navPage.classList.remove('active')
  });
}

if (navTrigger && navPage) {
  navTrigger.addEventListener('click', openNavPage);
}
// 可选：Esc 键关闭
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeNavPage();
});
/**
 * AILEENA Mechanical Aesthetic - Main JavaScript
 * Unified management for sound, modals, animations, and interactions
 * 
 * Color Scheme:
 * - Background: #0A0A0A (deep black with metal texture)
 * - Panel Base: #1F1F1F (brushed metal)
 * - Border: #444
 * - Accent Red: #FF2A00 (warning/mechanical)
 * - Accent Cyan: #00E0FF (cyber/neon)
 * - Metal Silver: #C0C0C0 (highlights)
 */

class MechanicalAesthetic {
  constructor() {
    this.audioPool = [];
    this.maxConcurrentSounds = 3;
    this.soundVolume = 0.5;
    this.modals = new Map();
    this.initAudioPool();
    this.setupMechanicalElements();
    this.setupGlobalInteractions();
  }

  /**
   * Initialize audio pool for sound management
   */
  initAudioPool() {
    for (let i = 0; i < this.maxConcurrentSounds; i++) {
      const audio = new Audio();
      audio.volume = this.soundVolume;
      this.audioPool.push({
        element: audio,
        isPlaying: false,
        scheduled: Promise.resolve()
      });
    }
  }

  /**
   * Play sound with audio pool management (prevent overlapping)
   */
  async playSound(srcPath, fadeIn = false) {
    const availableAudio = this.audioPool.find(a => !a.isPlaying);
    
    if (!availableAudio) {
      console.warn('Audio pool exhausted');
      return;
    }

    const audio = availableAudio.element;
    audio.src = srcPath;
    audio.currentTime = 0;

    if (fadeIn) {
      audio.volume = 0;
      audio.play().catch(err => console.log('Autoplay prevented:', err));
      
      const fadeInterval = setInterval(() => {
        if (audio.volume < this.soundVolume) {
          audio.volume = Math.min(audio.volume + 0.05, this.soundVolume);
        } else {
          clearInterval(fadeInterval);
        }
      }, 50);
    } else {
      audio.play().catch(err => console.log('Autoplay prevented:', err));
    }

    availableAudio.isPlaying = true;
    audio.onended = () => {
      availableAudio.isPlaying = false;
      audio.volume = this.soundVolume;
    };
  }

  /**
   * Setup mechanical CSS classes and metal effects
   */
  setupMechanicalElements() {
    // Create style tag for dynamic mechanical classes
    const style = document.createElement('style');
    style.textContent = `
      /* Mechanical Panel Base */
      .mech-panel {
        background: #1F1F1F;
        border: 2px solid #444;
        box-shadow: 
          inset 0 2px 4px rgba(0, 0, 0, 0.8),
          0 0 15px rgba(0, 224, 255, 0.15);
      }

      /* Metal Button */
      .metal-button {
        background: linear-gradient(to bottom, #C0C0C0, #666);
        color: #FF2A00;
        border: 2px solid #555;
        padding: 12px 24px;
        font-weight: 600;
        letter-spacing: 2px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all cubic-bezier(0.23, 1, 0.32, 1) 0.3s;
        box-shadow: 0 0 10px rgba(255, 42, 0, 0.4);
      }

      .metal-button:hover {
        box-shadow: 
          0 0 20px rgba(255, 42, 0, 0.6),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        transform: scale(1.02);
      }

      .metal-button:active {
        transform: scale(0.98);
      }

      /* Scanline Hover Effect */
      .scanline-hover {
        position: relative;
        overflow: hidden;
      }

      .scanline-hover::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: repeating-linear-gradient(
          0deg,
          rgba(255, 255, 255, 0.03) 0px,
          rgba(255, 255, 255, 0.03) 1px,
          transparent 1px,
          transparent 2px
        );
        pointer-events: none;
        opacity: 0;
        transition: opacity cubic-bezier(0.23, 1, 0.32, 1) 0.3s;
      }

      .scanline-hover:hover::before {
        opacity: 1;
      }

      /* Neon Glow Text */
      .neon-text {
        text-shadow: 
          0 0 10px #00E0FF,
          0 0 20px #00E0FF,
          0 0 30px rgba(0, 224, 255, 0.5);
        letter-spacing: 2px;
      }

      /* Pulsing Animation */
      @keyframes neon-pulse {
        0%, 100% { text-shadow: 0 0 10px #00E0FF, 0 0 20px #00E0FF; }
        50% { text-shadow: 0 0 20px #00E0FF, 0 0 40px #00E0FF; }
      }

      .neon-pulse {
        animation: neon-pulse 4s infinite;
      }

      /* Gear Rotation */
      @keyframes gear-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .gear-spin {
        animation: gear-spin 0.8s linear;
      }

      /* Rivets (decorative) */
      .rivet {
        display: inline-block;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle at 30% 30%, #777, #333);
        border-radius: 50%;
        box-shadow: inset -1px -1px 2px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(255, 255, 255, 0.2);
      }

      /* Breathing Animation */
      @keyframes metal-breathe {
        0%, 100% { box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 224, 255, 0.15); }
        50% { box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 224, 255, 0.25); }
      }

      .metal-breathe {
        animation: metal-breathe 4s ease-in-out infinite;
      }

      /* Shake Effect (warning) */
      @keyframes metal-shake {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-1px); }
        75% { transform: translateY(1px); }
      }

      .metal-shake {
        animation: metal-shake 0.15s;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup global micro-interactions
   */
  setupGlobalInteractions() {
    // Make all metal buttons respond to hover
    document.querySelectorAll('.metal-button').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        this.playSound('assets/sounds/button-hover.mp3', false);
      });
    });

    // Setup section fade-in on scroll with IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.content-section').forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(30px)';
      section.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
      observer.observe(section);
    });
  }

  /**
   * Open modal with mechanical animation
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.95) rotateX(5deg)';

    setTimeout(() => {
      modal.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1) rotateX(0deg)';
      this.playSound('assets/sounds/modal-open.mp3', false);
    }, 10);
  }

  /**
   * Close modal with mechanical animation
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.95) rotateX(-5deg)';

    setTimeout(() => {
      modal.style.display = 'none';
      this.playSound('assets/sounds/modal-close.mp3', false);
    }, 300);
  }

  /**
   * Add particles effect on click
   */
  createClickParticles(e) {
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        width: 4px;
        height: 4px;
        background: #FF2A00;
        border-radius: 50%;
        pointer-events: none;
        box-shadow: 0 0 8px #FF2A00;
        z-index: 9999;
      `;
      document.body.appendChild(particle);

      const angle = (i / particleCount) * Math.PI * 2;
      const velocity = 3 + Math.random() * 2;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      let x = e.clientX;
      let y = e.clientY;

      const animate = () => {
        x += vx;
        y += vy;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = parseFloat(particle.style.opacity || 1) - 0.02;

        if (parseFloat(particle.style.opacity) > 0) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      };
      animate();
    }
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mechAesthetic = new MechanicalAesthetic();
  });
} else {
  window.mechAesthetic = new MechanicalAesthetic();
}

// Graceful degradation for browsers without support
if (typeof Proxy === 'undefined') {
  console.warn('Your browser may not support all mechanical features');
}

// ================== DJ Deck 功能增强 ==================
// 依赖：wavesurfer.js (建议在 index.html 加入CDN)

// 全局音频上下文（iOS兼容）
let audioContext = window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
window.audioContext = audioContext;
document.body.addEventListener('touchstart', () => {
  if (audioContext.state === 'suspended') audioContext.resume();
}, { once: true });

// Deck对象
let deckL = { gain: audioContext.createGain(), eq: {}, wave: null, source: null, buffer: null };
let deckR = { gain: audioContext.createGain(), eq: {}, wave: null, source: null, buffer: null };
deckL.gain.connect(audioContext.destination);
deckR.gain.connect(audioContext.destination);

// 拖拽支持
document.body.addEventListener('dragover', e => e.preventDefault());
document.body.addEventListener('drop', async e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('audio/')) return;
  const side = confirm('放进左盘?（取消则右盘）') ? 'left' : 'right';
  await loadFileToDeck(file, side);
});

// 本地文件
function setupFileInputs() {
  const leftInput = document.createElement('input');
  leftInput.type = 'file';
  leftInput.accept = 'audio/*';
  leftInput.style.display = 'none';
  leftInput.id = 'upload-left';
  document.body.appendChild(leftInput);
  leftInput.addEventListener('change', e => loadTrack(e, 'left'));

  const rightInput = document.createElement('input');
  rightInput.type = 'file';
  rightInput.accept = 'audio/*';
  rightInput.style.display = 'none';
  rightInput.id = 'upload-right';
  document.body.appendChild(rightInput);
  rightInput.addEventListener('change', e => loadTrack(e, 'right'));

  // 按钮事件
  document.querySelectorAll('.deck').forEach(deck => {
    const side = deck.querySelector('.vinyl')?.id?.includes('left') ? 'left' : 'right';
    let btn = deck.querySelector('.neon-btn');
    if (btn) {
      btn.insertAdjacentHTML('afterend', `<button class="metal-button" onclick="document.getElementById('upload-${side}').click()">本地文件</button>`);
    }
  });
}
setupFileInputs();

async function loadTrack(e, side) {
  if (audioContext.state === 'suspended') await audioContext.resume();
  const file = e.target.files[0];
  if (!file) return;
  await loadFileToDeck(file, side);
}

async function loadFileToDeck(file, side) {
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  playBufferOnDeck(audioBuffer, side);
  createWaveform(side, file);
}

// URL加载
window.loadFromURL = async function(side) {
  const url = prompt('请输入音频URL（需支持CORS）');
  if (!url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('加载失败');
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    playBufferOnDeck(audioBuffer, side);
    createWaveform(side, new Blob([arrayBuffer]));
    alert('URL 加载成功！');
  } catch (err) {
    alert('URL 加载失败（可能是跨域或非音频文件）：\n' + err.message);
  }
}

// 播放buffer到deck
function playBufferOnDeck(audioBuffer, side) {
  const deck = side === 'left' ? deckL : deckR;
  if (deck.source) deck.source.stop();
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  setupEQ(deck, side, source);
  source.connect(deck.eq.highshelf);
  deck.eq.highshelf.connect(deck.gain);
  source.start();
  deck.source = source;
  deck.buffer = audioBuffer;
}

// 3段EQ
function setupEQ(deck, side, source) {
  const lowshelf = audioContext.createBiquadFilter();
  const peaking = audioContext.createBiquadFilter();
  const highshelf = audioContext.createBiquadFilter();
  lowshelf.type = 'lowshelf'; lowshelf.frequency.value = 200;
  peaking.type = 'peaking'; peaking.frequency.value = 1000; peaking.Q.value = 1;
  highshelf.type = 'highshelf'; highshelf.frequency.value = 3000;
  deck.eq = { lowshelf, peaking, highshelf };
  source.connect(lowshelf); lowshelf.connect(peaking); peaking.connect(highshelf);
  // 动态生成EQ滑块
  let eqDiv = document.getElementById('eq-' + side);
  if (!eqDiv) {
    eqDiv = document.createElement('div');
    eqDiv.id = 'eq-' + side;
    eqDiv.className = 'eq-controls';
    eqDiv.innerHTML = `
      <label>LOW</label><input type="range" class="eq-low" min="-12" max="12" value="0" step="0.1">
      <label>MID</label><input type="range" class="eq-mid" min="-12" max="12" value="0" step="0.1">
      <label>HIGH</label><input type="range" class="eq-high" min="-12" max="12" value="0" step="0.1">
    `;
    const deckDom = document.getElementById('vinyl-' + side)?.closest('.deck');
    if (deckDom) deckDom.appendChild(eqDiv);
  }
  eqDiv.querySelector('.eq-low').oninput = e => { lowshelf.gain.value = parseFloat(e.target.value); };
  eqDiv.querySelector('.eq-mid').oninput = e => { peaking.gain.value = parseFloat(e.target.value); };
  eqDiv.querySelector('.eq-high').oninput = e => { highshelf.gain.value = parseFloat(e.target.value); };
}

// Crossfader
function setupCrossfader() {
  let cross = document.getElementById('crossfader');
  if (!cross) {
    cross = document.createElement('input');
    cross.type = 'range';
    cross.id = 'crossfader';
    cross.min = 0; cross.max = 1; cross.step = 0.01; cross.value = 0.5;
    cross.style.width = '60%';
    cross.style.margin = '40px auto 0';
    cross.className = 'metal-button';
    document.querySelector('.real-dj-section').appendChild(cross);
  }
  cross.oninput = e => {
    const val = parseFloat(e.target.value);
    deckL.gain.gain.value = 1 - val;
    deckR.gain.gain.value = val;
  };
}
setupCrossfader();

// 波形可视化（需 wavesurfer.js CDN）
function createWaveform(side, fileOrBlob) {
  if (typeof WaveSurfer === 'undefined') return;
  const containerId = 'wave-' + side;
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.height = '80px';
    container.style.background = '#000';
    container.style.margin = '20px 0';
    const deckDom = document.getElementById('vinyl-' + side)?.closest('.deck');
    if (deckDom) deckDom.insertBefore(container, deckDom.querySelector('.track-info'));
  }
  if (side === 'left' && deckL.wave) { deckL.wave.destroy(); deckL.wave = null; }
  if (side === 'right' && deckR.wave) { deckR.wave.destroy(); deckR.wave = null; }
  const ws = WaveSurfer.create({
    container: container,
    waveColor: '#00ffea',
    progressColor: '#ff0066',
    cursorColor: '#fff',
    barWidth: 3,
    barGap: 2,
    height: 80,
    normalize: true,
    backend: 'MediaElement',
  });
  ws.loadBlob(fileOrBlob);
  if (side === 'left') deckL.wave = ws; else deckR.wave = ws;
}

// Scratch（基础实现：拖拽vinyl暂停动画）
function enableScratch() {
  ['left','right'].forEach(side => {
    const vinyl = document.getElementById('vinyl-' + side);
    let isScratching = false, prevX = 0;
    if (!vinyl) return;
    vinyl.onmousedown = startScratch;
    vinyl.ontouchstart = startScratch;
    document.onmousemove = onScratch;
    document.ontouchmove = onScratch;
    document.onmouseup = endScratch;
    document.ontouchend = endScratch;
    function startScratch(e) {
      e.preventDefault(); isScratching = true;
      prevX = e.clientX || (e.touches && e.touches[0].clientX);
      vinyl.classList.remove('playing');
    }
    function onScratch(e) {
      if (!isScratching) return;
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      const deltaX = (x - prevX) * 0.8;
      prevX = x;
      vinyl.style.transform = `rotate(${deltaX * 2}deg)`;
    }
    function endScratch() {
      isScratching = false;
      vinyl.classList.add('playing');
      vinyl.style.transform = '';
    }
  });
}
enableScratch();

// URL加载按钮（自动加到每个deck）
function setupURLButtons() {
  document.querySelectorAll('.deck').forEach(deck => {
    const side = deck.querySelector('.vinyl')?.id?.includes('left') ? 'left' : 'right';
    let btn = deck.querySelector('.neon-btn');
    if (btn) {
      btn.insertAdjacentHTML('afterend', `<button class="metal-button" onclick="loadFromURL('${side}')">加载URL</button>`);
    }
  });
}
setupURLButtons();
