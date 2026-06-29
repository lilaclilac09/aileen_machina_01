# AILEENA MECHANICAL AESTHETIC SETUP

## ✅ Preparation Complete

### Project Structure
```
/Users/aileen/aileen_machina/
├── index.html (main page - updated with main.js)
├── main.js (mechanical engine - NEWLY CREATED)
├── assets/
│   └── sounds/ (sound pool directory - NEWLY CREATED)
│       ├── mechanical-hum-loop.mp3
│       ├── button-hover.mp3
│       ├── modal-open.mp3
│       ├── modal-close.mp3
│       └── [...more sound files to be added]
├── bg_pic/ (existing images)
├── sound/ (existing sound files)
├── outputs/ (existing outputs directory)
│
```

---

## 🎨 Color Palette (Locked)
- **Deep Black**: `#0A0A0A` - Main background
- **Brushed Metal**: `#1F1F1F` - Panel base
- **Metal Border**: `#444` - 2px solid borders
- **Mechanical Red**: `#FF2A00` - Warning/emergency accent
- **Cyber Cyan**: `#00E0FF` - Neon glow accent
- **Silver Highlight**: `#C0C0C0` - Metal gradients

---

## 📦 CSS Framework Setup

### Available Mechanical Classes
All defined in `main.js` and ready to use:

1. **`.mech-panel`** - Panel base styling
   - Background: #1F1F1F
   - Border: 2px solid #444
   - Inset shadow + cyan glow

2. **`.metal-button`** - Interactive button styling
   - Gradient background (silver to gray)
   - Hover effects (scale 1.02, enhanced glow)
   - Mechanical red accent color

3. **`.scanline-hover`** - Scanline effect overlay
   - Horizontal lines opacity 0→1 on hover
   - Smooth easing cubic-bezier(0.23, 1, 0.32, 1)

4. **`.neon-text`** - Glowing text effect
   - Triple-layer text-shadow
   - #00E0FF cyan glow

5. **`.neon-pulse`** - Breathing animation
   - 4s infinite pulsing glow
   - Smooth brightness variation

6. **`.gear-spin`** - Rotation animation
   - 0.8s linear rotation
   - 0→360° continuous

7. **`.metal-shake`** - Warning shake effect
   - 0.15s rapid Y-axis shake

8. **`.metal-breathe`** - Breathing shadow effect
   - 4s ease-in-out box-shadow pulse

---

## 🔊 Audio Pool System

`main.js` provides:
- **Max concurrent sounds**: 3
- **Volume**: 0.5 (50%)
- **Playback method**: `mechAesthetic.playSound(srcPath, fadeIn)`

```javascript
// Example usage:
mechAesthetic.playSound('assets/sounds/mechanical-hum.mp3', true);
```

---

## 🎭 Modal System

Ready to use:
```javascript
// Open modal with mechanical animation
mechAesthetic.openModal('modalId');

// Close modal with reverse animation
mechAesthetic.closeModal('modalId');
```

---

## 🎬 Global Micro-Interactions

Automatically enabled:
- Section fade-in on scroll (IntersectionObserver)
- Button hover sounds
- Metal button interactions
- Scanline effects

---

## 📱 Design Constraints (LOCKED)

### MUST-KEEP Elements
- ✅ **Hero slider** - 2 slides with dots
- ✅ **Navigation header** - scrolled state
- ✅ **Custom cursor** - ring + dot
- ✅ **All section titles** - 80px uppercase
- ✅ **Gallery grid** - 3/4 aspect ratio items
- ✅ **Footer spacing** - top 140px padding

### DO NOT MODIFY
- Layout direction (vertical scroll)
- Font families (Barlow Condensed, Oswald, Inter)
- Grid column structures
- Section background colors (#000)
- Header navigation alignment

---

## 🚀 Implementation Roadmap

Next 8 prompts in order:

1. **Prompt 1**: Audio Player (SOUND section)
2. **Prompt 2**: Blog Read More Modals
3. **Prompt 3**: Contact Form
4. **Prompt 4**: Gallery Lightbox
5. **Prompt 5**: Works Project Modal
6. **Prompt 6**: Global Micro-Interactions
7. **Prompt 7**: Footer + Mobile Optimization
8. **Prompt 8**: Final Polish & Performance

---

## 📝 Sound Files Needed

For audio pool to work smoothly, create these files in `/assets/sounds/`:

1. `mechanical-hum-loop.mp3` - Low frequency ambient
2. `button-hover.mp3` - Short click sound (0.2s)
3. `modal-open.mp3` - Whoosh/mechanical open (0.4s)
4. `modal-close.mp3` - Reverse whoosh (0.4s)
5. `error-beep.mp3` - High-pitched warning (0.3s)
6. `success-chime.mp3` - Positive feedback (0.5s)

---

## ✨ Ready for Next Steps

All foundation is set. Proceed with Prompt 1 (Audio Player) when ready!
