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
