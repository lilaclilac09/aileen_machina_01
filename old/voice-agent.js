/**
 * AILEENA Voice Agent
 * Provides voice recognition, dynamic greetings, gamified heart hunt,
 * ambient music, and personalized interactions.
 *
 * Color Scheme:
 * - Background: #0A0A0A / #1F1F1F (mechanical panels)
 * - Border: #444
 * - Accent Red: #FF2A00
 * - Accent Cyan: #00E0FF
 * - Metal Silver: #C0C0C0
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const RESPONSE_AUTO_HIDE_MS   = 8000;
const HEART_HIDE_DELAY_MS     = 2000;
const MIN_HEART_OPACITY       = 0.03;
const MAX_HEART_OPACITY       = 0.35;
const OPACITY_DISTANCE_FACTOR = 50;
/** Musical notes (Hz): A1, E2, A2 – calm industrial drone */
const AMBIENT_FREQUENCIES     = [55, 82.5, 110];
/** Show WARM hint at most once every N throttled mousemove cycles */
const WARM_HINT_INTERVAL      = 20;

class VoiceAgent {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis || null;
    this.isListening = false;
    this.ambientAudio = null;
    this.ambientPlaying = false;
    this.heartFound = false;
    this.heartPosition = null; // {x, y} as viewport percentages
    this.mouseMoveThrottle = null;
    this._warmHintCounter = 0;

    this._injectStyles();
    this._buildUI();
    this._initSpeechRecognition();
    this._showDynamicGreeting();
    this._placeHiddenHeart();
    this._initAmbientMusic();
    this._trackMouseForHints();
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── Voice Agent Floating Button ── */
      #va-mic-btn {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #1F1F1F 0%, #2a2a2a 100%);
        border: 2px solid #444;
        color: #00E0FF;
        font-size: 22px;
        cursor: pointer;
        z-index: 8000;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 18px rgba(0,224,255,0.25), inset 0 2px 4px rgba(0,0,0,0.6);
        transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
        outline: none;
      }
      #va-mic-btn:hover {
        border-color: #00E0FF;
        box-shadow: 0 0 28px rgba(0,224,255,0.5), inset 0 2px 4px rgba(0,0,0,0.6);
        transform: scale(1.08);
      }
      #va-mic-btn.listening {
        border-color: #FF2A00;
        color: #FF2A00;
        box-shadow: 0 0 28px rgba(255,42,0,0.6), inset 0 2px 4px rgba(0,0,0,0.6);
        animation: va-pulse 1.2s ease-in-out infinite;
      }
      @keyframes va-pulse {
        0%,100% { box-shadow: 0 0 20px rgba(255,42,0,0.5); }
        50%      { box-shadow: 0 0 40px rgba(255,42,0,0.8); }
      }

      /* ── Response Box ── */
      #va-response {
        position: fixed;
        bottom: 100px;
        right: 30px;
        max-width: 320px;
        background: #1F1F1F;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 16px 20px;
        font-family: 'Barlow Condensed','Oswald','Inter',sans-serif;
        font-size: 14px;
        letter-spacing: 1px;
        color: #C0C0C0;
        z-index: 8000;
        display: none;
        box-shadow: 0 0 20px rgba(0,224,255,0.12), inset 0 2px 4px rgba(0,0,0,0.5);
        line-height: 1.6;
        animation: va-slide-in 0.35s cubic-bezier(0.23,1,0.32,1) both;
      }
      @keyframes va-slide-in {
        from { opacity:0; transform:translateY(14px); }
        to   { opacity:1; transform:translateY(0); }
      }
      #va-response .va-label {
        font-size: 10px;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: #00E0FF;
        margin-bottom: 8px;
      }
      #va-close-btn {
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        color: #666;
        font-size: 16px;
        cursor: pointer;
        line-height: 1;
        padding: 0;
      }
      #va-close-btn:hover { color: #FF2A00; }

      /* ── Dynamic Greeting Banner ── */
      #va-greeting {
        position: fixed;
        top: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(31,31,31,0.92);
        border: 1px solid #444;
        border-top: 2px solid #00E0FF;
        padding: 12px 28px;
        font-family: 'Barlow Condensed','Oswald','Inter',sans-serif;
        font-size: 13px;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: #C0C0C0;
        z-index: 7500;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 24px rgba(0,0,0,0.5);
        white-space: nowrap;
        animation: va-greeting-in 0.6s cubic-bezier(0.23,1,0.32,1) both,
                   va-greeting-out 0.6s cubic-bezier(0.23,1,0.32,1) 5s both;
      }
      @keyframes va-greeting-in {
        from { opacity:0; transform:translateX(-50%) translateY(-20px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
      @keyframes va-greeting-out {
        from { opacity:1; }
        to   { opacity:0; pointer-events:none; }
      }

      /* ── Ambient Music Button ── */
      #va-music-btn {
        position: fixed;
        bottom: 100px;
        right: 30px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #1F1F1F 0%, #2a2a2a 100%);
        border: 2px solid #444;
        color: #C0C0C0;
        font-size: 16px;
        cursor: pointer;
        z-index: 7900;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px rgba(0,0,0,0.4);
        transition: all 0.3s ease;
        outline: none;
      }
      #va-music-btn:hover {
        border-color: #C0C0C0;
        box-shadow: 0 0 18px rgba(192,192,192,0.25);
        transform: scale(1.08);
      }
      #va-music-btn.playing {
        border-color: #00E0FF;
        color: #00E0FF;
        box-shadow: 0 0 18px rgba(0,224,255,0.35);
      }

      /* ── Hidden Heart ── */
      #va-heart {
        position: fixed;
        font-size: 20px;
        cursor: pointer;
        z-index: 7000;
        opacity: 0.05;
        transition: opacity 0.5s ease, transform 0.3s ease;
        user-select: none;
        line-height: 1;
        filter: drop-shadow(0 0 4px rgba(255,42,0,0.4));
      }
      #va-heart:hover {
        opacity: 1 !important;
        transform: scale(1.4);
      }

      /* ── Heart Found Modal ── */
      #va-heart-modal {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.88);
        z-index: 9500;
        display: none;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
        animation: va-fade-in 0.4s ease both;
      }
      @keyframes va-fade-in { from{opacity:0} to{opacity:1} }
      #va-heart-modal.active { display: flex; }
      #va-heart-modal-inner {
        background: #1F1F1F;
        border: 2px solid #FF2A00;
        padding: 48px 56px;
        text-align: center;
        max-width: 480px;
        font-family: 'Barlow Condensed','Oswald','Inter',sans-serif;
        box-shadow: 0 0 60px rgba(255,42,0,0.3), inset 0 2px 4px rgba(0,0,0,0.6);
        position: relative;
        animation: va-modal-pop 0.4s cubic-bezier(0.23,1,0.32,1) both;
      }
      @keyframes va-modal-pop {
        from { opacity:0; transform:scale(0.88); }
        to   { opacity:1; transform:scale(1); }
      }
      #va-heart-modal-inner .heart-big { font-size: 56px; margin-bottom: 20px; }
      #va-heart-modal-inner h2 {
        font-size: 28px;
        letter-spacing: 6px;
        text-transform: uppercase;
        color: #FF2A00;
        margin-bottom: 14px;
        text-shadow: 0 0 20px rgba(255,42,0,0.5);
      }
      #va-heart-modal-inner p {
        font-size: 15px;
        color: #C0C0C0;
        line-height: 1.8;
        letter-spacing: 1px;
      }
      #va-heart-close {
        position: absolute;
        top: 16px;
        right: 20px;
        background: none;
        border: none;
        color: #666;
        font-size: 22px;
        cursor: pointer;
      }
      #va-heart-close:hover { color: #FF2A00; }

      /* ── Proximity Hint Toast ── */
      #va-hint {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(31,31,31,0.92);
        border: 1px solid #444;
        padding: 10px 20px;
        font-family: 'Barlow Condensed','Oswald','Inter',sans-serif;
        font-size: 12px;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: #C0C0C0;
        z-index: 7500;
        opacity: 0;
        pointer-events: none;
        transition: all 0.35s ease;
        white-space: nowrap;
      }
      #va-hint.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      #va-hint.hot  { color: #FF2A00; border-color: #FF2A00; }
      #va-hint.warm { color: #ffaa00; border-color: #ffaa00; }
      #va-hint.cold { color: #00E0FF; border-color: #00E0FF; }

      /* ── Voice not supported notice ── */
      #va-unsupported {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #1F1F1F;
        border: 1px solid #FF2A00;
        padding: 12px 18px;
        font-family: 'Barlow Condensed',sans-serif;
        font-size: 12px;
        letter-spacing: 2px;
        color: #FF2A00;
        z-index: 8001;
        display: none;
        animation: va-slide-in 0.35s ease both;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  _buildUI() {
    // Mic button
    this.micBtn = document.createElement('button');
    this.micBtn.id = 'va-mic-btn';
    this.micBtn.title = 'Voice command (click to speak)';
    this.micBtn.innerHTML = '🎙';
    this.micBtn.setAttribute('aria-label', 'Activate voice command');
    this.micBtn.addEventListener('click', () => this._toggleListening());
    document.body.appendChild(this.micBtn);

    // Response box
    this.responseBox = document.createElement('div');
    this.responseBox.id = 'va-response';
    this.responseBox.innerHTML = `
      <div class="va-label">◆ AILEENA AGENT</div>
      <button id="va-close-btn" aria-label="Close">×</button>
      <div id="va-response-text"></div>
    `;
    document.body.appendChild(this.responseBox);
    document.getElementById('va-close-btn').addEventListener('click', () => {
      this.responseBox.style.display = 'none';
    });

    // Ambient music button (initially hidden — positioned above mic btn)
    this.musicBtn = document.createElement('button');
    this.musicBtn.id = 'va-music-btn';
    this.musicBtn.title = 'Toggle ambient music';
    this.musicBtn.innerHTML = '♪';
    this.musicBtn.setAttribute('aria-label', 'Toggle ambient music');
    this.musicBtn.style.bottom = '100px';
    this.musicBtn.addEventListener('click', () => this._toggleAmbient());
    document.body.appendChild(this.musicBtn);

    // Hint toast
    this.hintEl = document.createElement('div');
    this.hintEl.id = 'va-hint';
    document.body.appendChild(this.hintEl);

    // Heart modal
    this.heartModal = document.createElement('div');
    this.heartModal.id = 'va-heart-modal';
    this.heartModal.innerHTML = `
      <div id="va-heart-modal-inner">
        <button id="va-heart-close" aria-label="Close">×</button>
        <div class="heart-big">❤️</div>
        <h2>You found the heart!</h2>
        <p>You discovered the secret heart hidden in the machine.<br>
           A small spark of warmth inside all this steel.<br><br>
           <span style="color:#00E0FF;letter-spacing:2px;">Thank you for exploring ✦</span></p>
      </div>
    `;
    document.body.appendChild(this.heartModal);
    document.getElementById('va-heart-close').addEventListener('click', () => {
      this.heartModal.classList.remove('active');
    });
    this.heartModal.addEventListener('click', (e) => {
      if (e.target === this.heartModal) this.heartModal.classList.remove('active');
    });
  }

  // ─── Dynamic Greeting ────────────────────────────────────────────────────

  _showDynamicGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 6)       greeting = '✦ Good night — the machines never sleep';
    else if (hour < 12) greeting = '✦ Good morning — welcome to AILEENA';
    else if (hour < 18) greeting = '✦ Good afternoon — explore the machine';
    else                greeting = '✦ Good evening — the studio awaits you';

    // Personalized name if stored
    const name = localStorage.getItem('va_visitor_name');
    if (name) greeting = greeting.replace('welcome to AILEENA', `welcome back, ${name}`);

    const banner = document.createElement('div');
    banner.id = 'va-greeting';
    banner.textContent = greeting;
    document.body.appendChild(banner);

    // Remove from DOM after animation completes
    setTimeout(() => banner.remove(), 6000);
  }

  // ─── Speech Recognition ───────────────────────────────────────────────────

  _initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VoiceAgent] Web Speech API not supported in this browser.');
      this.micBtn.title = 'Voice not supported in this browser';
      this.micBtn.style.opacity = '0.45';
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (e) => {
      const text = e.results[0][0].transcript.trim().toLowerCase();
      this._processCommand(text);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.micBtn.classList.remove('listening');
    };

    this.recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        this._showResponse(`Voice error: ${e.error}. Please try again.`);
      }
      this.isListening = false;
      this.micBtn.classList.remove('listening');
    };
  }

  _toggleListening() {
    if (!this.recognition) {
      this._showResponse('Voice commands are not supported in your browser. Try Chrome or Edge.');
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.micBtn.classList.remove('listening');
    } else {
      this.recognition.start();
      this.isListening = true;
      this.micBtn.classList.add('listening');
      this._showResponse('Listening… say a command like "What is this website?" or "Play music".');
    }
  }

  // ─── Command Processing ───────────────────────────────────────────────────

  _processCommand(text) {
    let response = null;

    if (/what is this (website|site)|about this site|tell me about/i.test(text)) {
      response = 'AILEENA Machina Studio is a multidisciplinary creative studio specializing in mechanical aesthetics, brutalist photography, and visual storytelling.';

    } else if (/play music|start music|music on|ambient/i.test(text)) {
      this._startAmbient();
      response = 'Ambient music started. The machines hum softly for you.';

    } else if (/stop music|pause music|music off|quiet/i.test(text)) {
      this._stopAmbient();
      response = 'Ambient music stopped.';

    } else if (/hello|hi|hey/i.test(text)) {
      response = 'Hello, explorer. Welcome to AILEENA Machina Studio.';

    } else if (/gallery/i.test(text)) {
      document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
      response = 'Navigating to the Gallery.';

    } else if (/sound|audio|podcast/i.test(text)) {
      document.getElementById('sound')?.scrollIntoView({ behavior: 'smooth' });
      response = 'Opening the Sound section.';

    } else if (/about/i.test(text)) {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
      response = 'Here is what AILEENA is about.';

    } else if (/contact/i.test(text)) {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      response = 'Taking you to the Contact section.';

    } else if (/find.*heart|where.*heart|heart.*hint|hint/i.test(text)) {
      response = this._getHeartHint();

    } else if (/my name is (.+)/i.test(text)) {
      const match = text.match(/my name is (.+)/i);
      const name = match[1].trim();
      localStorage.setItem('va_visitor_name', name);
      response = `Nice to meet you, ${name}. I will remember your name.`;

    } else if (/scroll (up|down|top|bottom)/i.test(text)) {
      if (/up|top/.test(text)) window.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      response = 'Scrolling ' + (/up|top/.test(text) ? 'to top.' : 'to bottom.');

    } else {
      response = `Command not recognized: "${text}". Try "What is this website?", "Play music", or "Find the heart".`;
    }

    if (response) {
      this._showResponse(response);
      this._speak(response);
    }
  }

  // ─── Response Display ─────────────────────────────────────────────────────

  _showResponse(text) {
    const textEl = document.getElementById('va-response-text');
    if (textEl) textEl.textContent = text;
    this.responseBox.style.display = 'block';
    // Auto-hide after 8 s
    clearTimeout(this._responseTimer);
    this._responseTimer = setTimeout(() => {
      this.responseBox.style.display = 'none';
    }, RESPONSE_AUTO_HIDE_MS);
  }

  // ─── Speech Synthesis ─────────────────────────────────────────────────────

  _speak(text) {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    // Prefer a slightly robotic/neutral English voice if available
    const voices = this.synthesis.getVoices();
    const preferred = voices.find(v => /en-US|en-GB/i.test(v.lang) && /google|microsoft/i.test(v.name));
    if (preferred) utterance.voice = preferred;
    this.synthesis.speak(utterance);
  }

  // ─── Ambient Music ────────────────────────────────────────────────────────

  _initAmbientMusic() {
    // Generate a gentle ambient tone using Web Audio API
    try {
      this._audioCtx = null; // lazy-initialize on first play to avoid autoplay block
    } catch (e) {
      console.warn('[VoiceAgent] Web Audio API not available');
    }
  }

  _getAudioCtx() {
    if (!this._audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this._audioCtx = new AudioContext();
      this._buildAmbientGraph();
    }
    return this._audioCtx;
  }

  _buildAmbientGraph() {
    const ctx = this._audioCtx;
    // Low drone: two detuned oscillators + reverb-like convolver simulation
    this._ambientNodes = [];

    const frequencies = AMBIENT_FREQUENCIES;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this._ambientMasterGain = masterGain;

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (i * 0.3), ctx.currentTime);
      gain.gain.setValueAtTime(0.12 - i * 0.03, ctx.currentTime);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      this._ambientNodes.push(osc);
    });

    // Subtle high-frequency shimmer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(880, ctx.currentTime);
    shimmerGain.gain.setValueAtTime(0.015, ctx.currentTime);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer.start();
    this._ambientNodes.push(shimmer);
  }

  _startAmbient() {
    const ctx = this._getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    this._ambientMasterGain.gain.cancelScheduledValues(ctx.currentTime);
    this._ambientMasterGain.gain.setValueAtTime(this._ambientMasterGain.gain.value, ctx.currentTime);
    this._ambientMasterGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 2);
    this.ambientPlaying = true;
    this.musicBtn.classList.add('playing');
    this.musicBtn.innerHTML = '♫';
  }

  _stopAmbient() {
    if (!this._audioCtx || !this._ambientMasterGain) return;
    const ctx = this._audioCtx;
    this._ambientMasterGain.gain.cancelScheduledValues(ctx.currentTime);
    this._ambientMasterGain.gain.setValueAtTime(this._ambientMasterGain.gain.value, ctx.currentTime);
    this._ambientMasterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    this.ambientPlaying = false;
    this.musicBtn.classList.remove('playing');
    this.musicBtn.innerHTML = '♪';
  }

  _toggleAmbient() {
    if (this.ambientPlaying) {
      this._stopAmbient();
    } else {
      this._startAmbient();
    }
  }

  // ─── Find the Heart Game ─────────────────────────────────────────────────

  _placeHiddenHeart() {
    // Place the heart at a random but stable position (persisted per session)
    let pos = sessionStorage.getItem('va_heart_pos');
    if (pos) {
      pos = JSON.parse(pos);
    } else {
      // Avoid edges — keep within 15-85% of viewport
      pos = {
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 70
      };
      sessionStorage.setItem('va_heart_pos', JSON.stringify(pos));
    }
    this.heartPosition = pos;

    const heart = document.createElement('div');
    heart.id = 'va-heart';
    heart.textContent = '❤';
    heart.title = 'You found the hidden heart!';
    heart.style.left = pos.x + 'vw';
    heart.style.top = pos.y + 'vh';
    heart.setAttribute('aria-label', 'Hidden heart — find me!');
    heart.addEventListener('click', () => this._onHeartFound());
    document.body.appendChild(heart);
    this.heartEl = heart;
  }

  _onHeartFound() {
    if (this.heartFound) return;
    this.heartFound = true;
    this.heartEl.style.opacity = '1';
    this.heartModal.classList.add('active');
    this._speak('You found the hidden heart! Congratulations, explorer.');
    // Make heart pulse then hide
    this.heartEl.style.animation = 'va-pulse 0.5s ease 3';
    setTimeout(() => { this.heartEl.style.display = 'none'; }, HEART_HIDE_DELAY_MS);
    // Store in localStorage as achievement
    localStorage.setItem('va_heart_found', '1');
  }

  _getHeartHint() {
    if (this.heartFound) return 'You already found the heart. Well done!';
    const mouseX = (this._lastMouseX || 0) / window.innerWidth * 100;
    const mouseY = (this._lastMouseY || 0) / window.innerHeight * 100;
    const dist = Math.hypot(mouseX - this.heartPosition.x, mouseY - this.heartPosition.y);
    if (dist < 8)  return '🔥 VERY HOT — you are almost on top of the heart!';
    if (dist < 20) return '🌡 WARM — keep looking nearby…';
    if (dist < 40) return '❄ COOL — move around the page to find the heart.';
    return '🧊 COLD — the heart is hiding far from where you are now.';
  }

  // ─── Mouse Tracking for Proximity Hints ──────────────────────────────────

  _trackMouseForHints() {
    if (this.heartFound) return;
    let hintTimeout = null;

    document.addEventListener('mousemove', (e) => {
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;

      if (this.heartFound || this.mouseMoveThrottle) return;
      this.mouseMoveThrottle = setTimeout(() => {
        this.mouseMoveThrottle = null;
      }, 500);

      const mouseX = (e.clientX / window.innerWidth) * 100;
      const mouseY = (e.clientY / window.innerHeight) * 100;
      const dist = Math.hypot(mouseX - this.heartPosition.x, mouseY - this.heartPosition.y);

      // Show proximity on the hidden heart element via opacity
      if (this.heartEl) {
        const opacity = Math.max(MIN_HEART_OPACITY, Math.min(MAX_HEART_OPACITY, 1 - dist / OPACITY_DISTANCE_FACTOR));
        this.heartEl.style.opacity = String(opacity);
      }

      // Show a periodic hint if very close (counter-based, not random)
      this._warmHintCounter++;
      if (dist < 10) {
        clearTimeout(hintTimeout);
        this._showHint('🔥 VERY HOT', 'hot');
        hintTimeout = setTimeout(() => this._hideHint(), 2000);
      } else if (dist < 22 && this._warmHintCounter % WARM_HINT_INTERVAL === 0) {
        clearTimeout(hintTimeout);
        this._showHint('🌡 WARM', 'warm');
        hintTimeout = setTimeout(() => this._hideHint(), 1500);
      }
    });
  }

  _showHint(text, level) {
    this.hintEl.textContent = text;
    this.hintEl.className = `show ${level}`;
  }

  _hideHint() {
    this.hintEl.classList.remove('show', 'hot', 'warm', 'cold');
  }
}

// ─── Initialize ───────────────────────────────────────────────────────────────

(function initVoiceAgent() {
  const init = () => { window.voiceAgent = new VoiceAgent(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
