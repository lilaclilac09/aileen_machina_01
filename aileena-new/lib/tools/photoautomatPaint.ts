/** Painted surfaces for the Photoautomat stage. Every texture is drawn here; no photographs, no third-party art. */

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function surface(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d canvas');
  return { canvas, ctx };
}

function grey(value: number) {
  const v = Math.max(0, Math.min(255, Math.round(value)));
  return `rgb(${v},${v},${v})`;
}

/** Draws at every wrapped position, so a tile's edges meet. */
function wrapped(size: number, x: number, y: number, reach: number, draw: (x: number, y: number) => void) {
  for (const ox of [-size, 0, size]) {
    for (const oy of [-size, 0, size]) {
      const px = x + ox;
      const py = y + oy;
      if (px + reach < 0 || px - reach > size || py + reach < 0 || py - reach > size) continue;
      draw(px, py);
    }
  }
}

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Brushed aluminium, one tile per metre: vertical grain, hand smears, scuffs. */
export function paintSteel(size: number) {
  const color = surface(size, size);
  const rough = surface(size, size);
  const rand = seeded(11);
  let drift = 0;
  for (let x = 0; x < size; x += 1) {
    drift = drift * 0.9 + (rand() - 0.5) * 7;
    const l = 166 + drift * 1.6 + (rand() - 0.5) * 26;
    color.ctx.fillStyle = `rgb(${Math.round(l)},${Math.round(l + 1)},${Math.round(l + 4)})`;
    color.ctx.fillRect(x, 0, 1, size);
    rough.ctx.fillStyle = grey(104 + drift * 2 + (rand() - 0.5) * 44);
    rough.ctx.fillRect(x, 0, 1, size);
  }
  for (let i = 0; i < size * 6; i += 1) {
    const x = Math.floor(rand() * size);
    const y = rand() * size;
    const len = 24 + rand() * size * 0.55;
    color.ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${0.03 + rand() * 0.09})` : `rgba(34,38,46,${0.03 + rand() * 0.08})`;
    color.ctx.fillRect(x, y, 1, len);
    color.ctx.fillRect(x, y - size, 1, len);
  }
  for (let i = 0; i < 34; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 50 + rand() * 190;
    const soil = rand() > 0.35;
    const strength = 0.04 + rand() * 0.09;
    const smear = rand() > 0.5 ? 232 : 58;
    wrapped(size, x, y, r, (px, py) => {
      const g = color.ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, soil ? `rgba(52,50,46,${strength})` : `rgba(255,255,255,${strength * 0.7})`);
      g.addColorStop(1, 'rgba(52,50,46,0)');
      color.ctx.fillStyle = g;
      color.ctx.fillRect(px - r, py - r, r * 2, r * 2);
      const q = rough.ctx.createRadialGradient(px, py, 0, px, py, r);
      q.addColorStop(0, `rgba(${smear},${smear},${smear},0.34)`);
      q.addColorStop(1, `rgba(${smear},${smear},${smear},0)`);
      rough.ctx.fillStyle = q;
      rough.ctx.fillRect(px - r, py - r, r * 2, r * 2);
    });
  }
  for (let i = 0; i < 110; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 8 + rand() * 130;
    const angle = rand() * Math.PI;
    const bend = (rand() - 0.5) * 0.5;
    for (const [ctx, ink] of [
      [color.ctx, `rgba(236,240,244,${0.16 + rand() * 0.3})`],
      [rough.ctx, 'rgba(210,210,210,0.5)'],
    ] as const) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.6 + rand() * 0.9;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + Math.cos(angle + bend) * len * 0.5,
        y + Math.sin(angle + bend) * len * 0.5,
        x + Math.cos(angle) * len,
        y + Math.sin(angle) * len,
      );
      ctx.stroke();
    }
  }
  return { color: color.canvas, rough: rough.canvas };
}

/** Granite setts, wet in places. */
export function paintSetts(size: number) {
  const color = surface(size, size);
  const rough = surface(size, size);
  const bump = surface(size, size);
  const rand = seeded(71);
  const count = 16;
  const cell = size / count;
  color.ctx.fillStyle = '#191817';
  color.ctx.fillRect(0, 0, size, size);
  rough.ctx.fillStyle = grey(236);
  rough.ctx.fillRect(0, 0, size, size);
  bump.ctx.fillStyle = '#000';
  bump.ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      const gap = 4 + rand() * 7;
      const w = cell - gap;
      const h = cell - (4 + rand() * 7);
      const x = col * cell + (row % 2 ? cell / 2 : 0) + (rand() - 0.5) * 7;
      const y = row * cell + (rand() - 0.5) * 7;
      const tone = 92 + rand() * 58;
      const warm = 4 + (rand() - 0.5) * 16;
      const wet = rand() > 0.72;
      const shine = wet ? 84 + rand() * 40 : 176 + rand() * 60;
      const corner = 5 + rand() * 9;
      for (const ox of [0, -size]) {
        roundedPath(color.ctx, x + ox, y, w, h, corner);
        color.ctx.fillStyle = `rgb(${Math.round((tone + warm) * (wet ? 0.78 : 1))},${Math.round(tone * (wet ? 0.8 : 1))},${Math.round(
          (tone - warm) * (wet ? 0.84 : 1),
        )})`;
        color.ctx.fill();
        roundedPath(rough.ctx, x + ox, y, w, h, corner);
        rough.ctx.fillStyle = grey(shine);
        rough.ctx.fill();
        const g = bump.ctx.createRadialGradient(x + ox + w / 2, y + h / 2, w * 0.1, x + ox + w / 2, y + h / 2, w * 0.74);
        g.addColorStop(0, grey(200 + rand() * 50));
        g.addColorStop(1, grey(70));
        roundedPath(bump.ctx, x + ox, y, w, h, corner);
        bump.ctx.fillStyle = g;
        bump.ctx.fill();
      }
    }
  }
  for (let i = 0; i < size * 30; i += 1) {
    const light = rand() > 0.5;
    color.ctx.fillStyle = light ? `rgba(226,222,214,${rand() * 0.16})` : `rgba(8,8,8,${rand() * 0.22})`;
    color.ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 2, 1 + rand() * 2);
  }
  return { color: color.canvas, rough: rough.canvas, bump: bump.canvas };
}

export function paintVelvet(size: number) {
  const { canvas, ctx } = surface(size, size);
  const rand = seeded(23);
  ctx.fillStyle = '#6c0a15';
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 1) {
    const a = rand();
    ctx.fillStyle = a > 0.5 ? `rgba(150,24,36,${(a - 0.5) * 0.3})` : `rgba(24,0,4,${(0.5 - a) * 0.36})`;
    ctx.fillRect(x, 0, 1, size);
  }
  for (let i = 0; i < size * 26; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(190,40,52,0.07)' : 'rgba(10,0,2,0.09)';
    ctx.fillRect(rand() * size, rand() * size, 1, 1 + rand() * 3);
  }
  return canvas;
}

/** Fine ribbed height: velvet pile, the stool's screw thread. */
export function paintWeave() {
  const { canvas, ctx } = surface(64, 64);
  const rand = seeded(61);
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      ctx.fillStyle = grey((y % 4 < 2 ? 170 : 70) + (rand() - 0.5) * 90);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

/** Studded rubber mat height. */
export function paintRubber() {
  const { canvas, ctx } = surface(64, 64);
  ctx.fillStyle = '#202020';
  ctx.fillRect(0, 0, 64, 64);
  for (const [x, y] of [
    [16, 16],
    [48, 48],
  ]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 11);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.7, '#ddd');
    g.addColorStop(1, '#202020');
    ctx.fillStyle = g;
    ctx.fillRect(x - 12, y - 12, 24, 24);
  }
  return canvas;
}

/** Soft round falloff, used for the contact shadow and the light that pools on the pavement. */
export function paintGlow() {
  const { canvas, ctx } = surface(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}

export const CABIN_INKS = [
  'rgba(18,8,10,0.88)',
  'rgba(244,236,214,0.84)',
  'rgba(250,250,248,0.8)',
  'rgba(232,196,64,0.82)',
  'rgba(14,79,79,0.78)',
  'rgba(12,12,14,0.86)',
  'rgba(210,40,48,0.7)',
  'rgba(186,196,204,0.72)',
];

export const STREET_INKS = ['rgba(170,140,78,0.7)', 'rgba(74,80,90,0.55)', 'rgba(18,18,20,0.8)', 'rgba(214,218,224,0.5)'];

const TAGS = ['KOTTI', '36', 'KT', '4', 'A', 'xxx', 'BERLIN'];

function withAlpha(ink: string, alpha: number) {
  return ink.replace(/[\d.]+\)$/, `${alpha})`);
}

function dripFrom(ctx: CanvasRenderingContext2D, rand: () => number, ink: string, x: number, y: number, weight: number) {
  const len = 18 + rand() * 90;
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1.2, weight * 0.28);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + (rand() - 0.5) * 8, y + len * 0.5, x + (rand() - 0.5) * 6, y + len);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + (rand() - 0.5) * 4, y + len, 1.4 + rand() * 2.4, 0, Math.PI * 2);
  ctx.fillStyle = ink;
  ctx.fill();
}

function sprayCloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ink: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(ink, alpha));
  g.addColorStop(0.55, withAlpha(ink, alpha * 0.35));
  g.addColorStop(1, withAlpha(ink, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.28);
  ctx.bezierCurveTo(x, y - s * 0.15, x - s, y - s * 0.1, x - s, y + s * 0.28);
  ctx.bezierCurveTo(x - s, y + s * 0.7, x, y + s * 0.95, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.95, x + s, y + s * 0.7, x + s, y + s * 0.28);
  ctx.bezierCurveTo(x + s, y - s * 0.1, x, y - s * 0.15, x, y + s * 0.28);
}

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, points: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Cabin wall: red gloss paint, scuffed pale where shoulders and bags rub, then years of tags. */
export function paintRedWall(size: number) {
  const { canvas, ctx } = surface(size, size);
  const rand = seeded(131);
  ctx.fillStyle = '#b3141f';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 60; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 60 + rand() * 260;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rand() > 0.45;
    g.addColorStop(0, dark ? `rgba(70,4,10,${0.1 + rand() * 0.16})` : `rgba(232,70,70,${0.05 + rand() * 0.1})`);
    g.addColorStop(1, 'rgba(70,4,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 260; i += 1) {
    const x = rand() * size;
    const y = size * (0.3 + rand() * 0.6);
    const len = 10 + rand() * 90;
    const angle = (rand() - 0.5) * 1.2;
    ctx.strokeStyle = `rgba(240,196,188,${0.05 + rand() * 0.16})`;
    ctx.lineWidth = 0.7 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.drawImage(paintGraffiti(size, size, 88, CABIN_INKS, 36), 0, 0);
  ctx.drawImage(paintGraffiti(size, size, 201, CABIN_INKS, 18), 0, 0);
  return canvas;
}

/** Layered marker, throw-ups, drips and tags. */
export function paintGraffiti(width: number, height: number, seed: number, inks: string[], count: number) {
  const { canvas, ctx } = surface(width, height);
  const rand = seeded(seed);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const min = Math.min(width, height);

  for (let n = 0; n < Math.ceil(count * 0.45); n += 1) {
    const ink = inks[Math.floor(rand() * inks.length)];
    sprayCloud(ctx, rand() * width, rand() * height, min * (0.08 + rand() * 0.18), ink, 0.12 + rand() * 0.18);
  }

  for (let n = 0; n < count; n += 1) {
    const ink = inks[Math.floor(rand() * inks.length)];
    const outline = inks[Math.floor(rand() * inks.length)];
    const kind = rand();
    const cx = min * 0.08 + rand() * (width - min * 0.16);
    const cy = min * 0.08 + rand() * (height - min * 0.16);
    ctx.globalAlpha = 0.72 + rand() * 0.28;

    if (kind < 0.16) {
      const word = TAGS[Math.floor(rand() * TAGS.length)];
      const size = min * (0.028 + rand() * 0.055);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rand() - 0.5) * 0.4);
      ctx.font = `600 ${Math.round(size)}px "Segoe Script", "Comic Sans MS", cursive, sans-serif`;
      ctx.lineWidth = Math.max(1.4, size * 0.07);
      ctx.strokeStyle = ink;
      ctx.strokeText(word, 0, 0);
      ctx.globalAlpha *= 0.45;
      ctx.fillStyle = ink;
      ctx.fillText(word, 0, 0);
      ctx.restore();
    } else if (kind < 0.34) {
      const size = min * (0.07 + rand() * 0.11);
      const glyphs = 2 + Math.floor(rand() * 3);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rand() - 0.5) * 0.22);
      ctx.globalAlpha *= 0.55 + rand() * 0.3;
      for (let i = 0; i < glyphs; i += 1) {
        const gx = (i - (glyphs - 1) / 2) * size * (0.55 + rand() * 0.2);
        const gy = (rand() - 0.5) * size * 0.18;
        ctx.beginPath();
        ctx.moveTo(gx - size * 0.2, gy);
        ctx.quadraticCurveTo(gx - size * 0.05, gy - size * (0.38 + rand() * 0.12), gx + size * 0.18, gy);
        ctx.quadraticCurveTo(gx - size * 0.02, gy + size * (0.32 + rand() * 0.12), gx - size * 0.18, gy + size * 0.04);
        ctx.closePath();
        ctx.fillStyle = withAlpha(ink, 0.55);
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = size * 0.045;
        ctx.stroke();
        if (rand() > 0.55) dripFrom(ctx, rand, ink, gx, gy + size * 0.28, size * 0.1);
      }
      ctx.restore();
    } else if (kind < 0.46) {
      const s = min * (0.035 + rand() * 0.06);
      heartPath(ctx, cx, cy, s);
      ctx.fillStyle = ink;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.stroke();
    } else if (kind < 0.54) {
      starPath(ctx, cx, cy, min * (0.022 + rand() * 0.03), 5);
      ctx.fillStyle = withAlpha(ink, 0.7);
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.5 + rand() * 2;
      ctx.stroke();
    } else if (kind < 0.66) {
      const s = min * (0.08 + rand() * 0.12);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3 + rand() * 7;
      ctx.beginPath();
      ctx.moveTo(cx - s, cy);
      ctx.lineTo(cx + s * 0.55, cy);
      ctx.moveTo(cx + s * 0.2, cy - s * 0.28);
      ctx.lineTo(cx + s * 0.55, cy);
      ctx.lineTo(cx + s * 0.2, cy + s * 0.28);
      ctx.stroke();
    } else {
      const reach = min * (0.1 + rand() * 0.2);
      const weight = 3 + rand() * 9;
      const points: Array<[number, number]> = [];
      let x = cx - reach * 0.55;
      let y = cy + (rand() - 0.5) * reach;
      const strokes = 5 + Math.floor(rand() * 5);
      for (let i = 0; i < strokes; i += 1) {
        points.push([x, y]);
        x += (reach * 1.25) / strokes + (rand() - 0.5) * reach * 0.4;
        y = cy + (rand() - 0.5) * reach;
      }
      ctx.strokeStyle = ink;
      ctx.lineWidth = weight;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length - 1; i += 1) {
        ctx.quadraticCurveTo(points[i][0], points[i][1], (points[i][0] + points[i + 1][0]) / 2, (points[i][1] + points[i + 1][1]) / 2);
      }
      ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
      ctx.stroke();
      if (rand() > 0.4) dripFrom(ctx, rand, ink, points[points.length - 1][0], points[points.length - 1][1], weight);
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 36; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 8 + rand() * 36;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${0.12 + rand() * 0.28})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function punch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 0) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  if (r > 0) {
    roundedPath(ctx, x, y, w, h, r);
    ctx.fillStyle = '#000';
    ctx.fill();
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/**
 * What the sitter faces: steel camera wall, red tagged cabin on either side.
 * Glass, slot and stool sit on the same percentages as `.foto-glass` / `.foto-slot`.
 */
export function paintCabinInterior() {
  const w = 1200;
  const h = 1600;
  const { canvas, ctx } = surface(w, h);
  const steel = paintSteel(512);
  const red = paintRedWall(1024);

  ctx.drawImage(red, 0, 0, w * 0.2, h);
  ctx.drawImage(red, w * 0.8, 0, w * 0.2, h);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.145, 0);
  ctx.lineTo(w * 0.855, 0);
  ctx.lineTo(w * 0.88, h);
  ctx.lineTo(w * 0.12, h);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(steel.color, w * 0.12, 0, w * 0.76, h);
  ctx.restore();

  const gx = w * 0.323;
  const gy = h * 0.272;
  const gw = w * 0.354;
  const gh = h * 0.253;
  ctx.fillStyle = '#141618';
  ctx.fillRect(gx - 10, gy - 10, gw + 20, gh + 20);
  const glass = ctx.createLinearGradient(gx, gy, gx + gw, gy + gh);
  glass.addColorStop(0, '#d5d8dc');
  glass.addColorStop(1, '#9aa0a6');
  ctx.fillStyle = glass;
  ctx.fillRect(gx, gy, gw, gh);
  const lx = gx + gw / 2;
  const ly = gy + gh / 2;
  ctx.fillStyle = '#0c0d0e';
  ctx.beginPath();
  ctx.arc(lx, ly, gh * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1428';
  ctx.beginPath();
  ctx.arc(lx, ly, gh * 0.09, 0, Math.PI * 2);
  ctx.fill();

  const sx = w * 0.31;
  const sy = h * 0.624;
  const sw = w * 0.38;
  const sh = h * 0.028;
  ctx.fillStyle = '#0b0c0d';
  ctx.fillRect(sx, sy, sw, sh);

  ctx.fillStyle = '#2a2a2c';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.965, w * 0.16, h * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1e';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.94, w * 0.145, h * 0.032, 0, 0, Math.PI * 2);
  ctx.fill();

  const scratch = seeded(19);
  ctx.save();
  ctx.strokeStyle = 'rgba(20,22,26,0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 70; i += 1) {
    const x = w * (0.16 + scratch() * 0.68);
    ctx.beginPath();
    ctx.moveTo(x, h * 0.05);
    ctx.lineTo(x + (scratch() - 0.5) * 8, h * 0.9);
    ctx.stroke();
  }
  ctx.restore();

  const tags = paintGraffiti(w, h, 404, CABIN_INKS, 26);
  const tagCtx = tags.getContext('2d');
  if (tagCtx) {
    punch(tagCtx, gx - 28, gy - 28, gw + 56, gh + 56, 8);
    punch(tagCtx, sx - 10, sy - 10, sw + 20, sh + 20, 2);
    punch(tagCtx, w * 0.32, h * 0.84, w * 0.36, h * 0.16);
  }
  ctx.drawImage(tags, 0, 0);
  const edge = paintGraffiti(Math.round(w * 0.22), h, 511, CABIN_INKS, 14);
  ctx.drawImage(edge, 0, 0, w * 0.18, h);
  ctx.drawImage(edge, w * 0.82, 0, w * 0.18, h);

  [['heart', w * 0.08, h * 0.22, 70] as const, ['kotti', w * 0.86, h * 0.58, 110] as const, ['smile', w * 0.9, h * 0.2, 64] as const, ['four', w * 0.1, h * 0.7, 58] as const].forEach(
    ([kind, x, y, size], index) => {
      const sticker = paintSticker(kind);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((index - 1.4) * 0.12);
      ctx.drawImage(sticker, -size / 2, -((size * sticker.height) / sticker.width) / 2, size, (size * sticker.height) / sticker.width);
      ctx.restore();
    },
  );

  return canvas;
}

/** Lit header: cream acrylic over tubes, teal lettering. Not the operator's red wordmark. */
export function paintSign() {
  const { canvas, ctx } = surface(2048, 256);
  const rand = seeded(7);
  const base = ctx.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, '#e9dcb6');
  base.addColorStop(0.5, '#f8efd2');
  base.addColorStop(1, '#e2d2a6');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 2048, 256);
  for (let i = 0; i < 5; i += 1) {
    const x = 204 + i * 410;
    const g = ctx.createRadialGradient(x, 128, 0, x, 128, 260);
    g.addColorStop(0, 'rgba(255,252,236,0.5)');
    g.addColorStop(1, 'rgba(255,252,236,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 260, 0, 520, 256);
  }
  ctx.fillStyle = '#0e4f4f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 168px "Helvetica Neue", Helvetica, Arial, sans-serif';
  const text = 'PHOTOAUTOMAT';
  const widths = text.split('').map((letter) => ctx.measureText(letter).width);
  const gap = 26;
  const total = widths.reduce((sum, value) => sum + value, 0) + gap * (text.length - 1);
  const fit = Math.min(1, 1840 / total);
  let x = 1024 - (total * fit) / 2;
  text.split('').forEach((letter, index) => {
    ctx.save();
    ctx.translate(x + (widths[index] * fit) / 2, 136);
    ctx.scale(fit, 1);
    ctx.fillText(letter, 0, 0);
    ctx.restore();
    x += (widths[index] + gap) * fit;
  });
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(90,70,30,${rand() * 0.07})`;
    ctx.fillRect(rand() * 2048, rand() * 256, 1 + rand() * 3, 1 + rand() * 3);
  }
  return canvas;
}

/** Display case card: what the booth does, and strips it printed. */
export function paintPoster(strips: HTMLCanvasElement[]) {
  const { canvas, ctx } = surface(1280, 760);
  const rand = seeded(19);
  ctx.fillStyle = '#ece4d0';
  ctx.fillRect(0, 0, 1280, 760);
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, 1280, 150);
  ctx.fillStyle = '#f1e9d6';
  ctx.textBaseline = 'middle';
  ctx.font = '700 74px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('FOUR POSES, ONE STRIP', 48, 80);
  ctx.fillStyle = '#1b1b1b';
  ctx.font = '500 34px "JetBrains Mono", ui-monospace, Menlo, monospace';
  ['sit down, pull the curtain', 'first flash after 5 seconds', 'then one every 7 seconds', 'four minutes in the baths', 'your strip drops outside'].forEach(
    (line, index) => {
      ctx.fillText(line, 48, 232 + index * 62);
    },
  );
  ctx.fillStyle = '#0e4f4f';
  ctx.font = '800 120px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('4', 48, 650);
  ctx.font = '600 40px "JetBrains Mono", ui-monospace, Menlo, monospace';
  ctx.fillText('frames · 4 min', 130, 664);
  const h = 540;
  strips.forEach((strip, index) => {
    const w = (h * strip.width) / strip.height;
    const x = 700 + index * (w + 46);
    ctx.save();
    ctx.translate(x + w / 2, 190 + h / 2);
    ctx.rotate((index - 1) * 0.035);
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.drawImage(strip, -w / 2, -h / 2, w, h);
    ctx.restore();
  });
  for (let i = 0; i < 2600; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? `rgba(80,60,30,${rand() * 0.07})` : `rgba(255,255,255,${rand() * 0.09})`;
    ctx.fillRect(rand() * 1280, rand() * 760, 1 + rand() * 2, 1 + rand() * 2);
  }
  return canvas;
}

/** Enamel plate beside the delivery slot. */
export function paintPlate() {
  const { canvas, ctx } = surface(256, 560);
  roundedPath(ctx, 4, 4, 248, 552, 14);
  ctx.fillStyle = '#e9e7e0';
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,40,40,0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 44px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('PHOTOS', 128, 86);
  ctx.fillText('OUT', 128, 140);
  ctx.font = '500 40px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('in', 128, 234);
  ctx.font = '800 64px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('4 min', 128, 300);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(60, 380);
  ctx.lineTo(180, 380);
  ctx.moveTo(150, 352);
  ctx.lineTo(182, 380);
  ctx.lineTo(150, 408);
  ctx.stroke();
  for (const [x, y] of [
    [28, 28],
    [228, 28],
    [28, 532],
    [228, 532],
  ]) {
    ctx.fillStyle = '#8c8c88';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

/** Tank name, read through the cleared front panel. */
export function paintLabel(text: string) {
  const { canvas, ctx } = surface(512, 128);
  roundedPath(ctx, 6, 22, 500, 84, 42);
  ctx.fillStyle = 'rgba(12,12,13,0.82)';
  ctx.fill();
  ctx.fillStyle = '#f1e9d6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 50px "JetBrains Mono", ui-monospace, Menlo, monospace';
  ctx.fillText(text, 256, 66);
  return canvas;
}

/** A street at night as one equirectangular panorama: dark sky, a ring of lit facades, lamps, wet ground. */
export function paintSky() {
  const { canvas, ctx } = surface(2048, 1024);
  const rand = seeded(211);
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#05070c');
  sky.addColorStop(0.55, '#111624');
  sky.addColorStop(1, '#3a3442');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 2048, 512);
  const ground = ctx.createLinearGradient(0, 512, 0, 1024);
  ground.addColorStop(0, '#15151a');
  ground.addColorStop(0.2, '#0b0b0e');
  ground.addColorStop(1, '#050506');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 512, 2048, 512);
  let x = 0;
  while (x < 2048) {
    const w = 90 + rand() * 210;
    const h = 80 + rand() * 190;
    const tone = 12 + rand() * 12;
    ctx.fillStyle = `rgb(${Math.round(tone + 3)},${Math.round(tone + 1)},${Math.round(tone + 4)})`;
    ctx.fillRect(x, 512 - h, w + 1, h + 4);
    const cols = Math.max(2, Math.floor(w / 34));
    const rows = Math.max(2, Math.floor(h / 30));
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const lit = rand();
        if (lit < 0.6) continue;
        ctx.fillStyle = lit > 0.95 ? '#fff6dc' : lit > 0.84 ? '#f2c078' : lit > 0.78 ? '#9fc4e8' : '#3c3222';
        ctx.fillRect(x + 10 + (c * (w - 20)) / cols, 512 - h + 12 + (r * (h - 16)) / rows, 13, 16);
      }
    }
    x += w;
  }
  for (const [lx, ly, reach, tint] of [
    [300, 470, 60, 'rgba(255,214,170,1)'],
    [760, 400, 120, 'rgba(255,236,206,1)'],
    [1180, 476, 70, 'rgba(120,220,255,0.95)'],
    [1560, 380, 130, 'rgba(255,170,90,1)'],
    [1900, 440, 90, 'rgba(255,240,220,1)'],
  ] as const) {
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, reach);
    g.addColorStop(0, tint);
    g.addColorStop(0.25, tint.replace(/[\d.]+\)$/, '0.5)'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - reach, ly - reach, reach * 2, reach * 2);
  }
  return canvas;
}

export const STICKER_KINDS = ['berlin', 'four', 'name', 'orb', 'kotti', 'heart', 'soft', 'smile'] as const;
export type StickerKind = (typeof STICKER_KINDS)[number];

const STICKER_SIZE: Record<StickerKind, [number, number]> = {
  berlin: [600, 240],
  four: [300, 300],
  name: [560, 170],
  orb: [300, 300],
  kotti: [520, 220],
  heart: [280, 280],
  soft: [560, 150],
  smile: [300, 300],
};

/** Paper, ink, then wear. Round kinds are die-cut; BERLIN has lost its top-right corner. */
export function paintSticker(kind: StickerKind) {
  const [w, h] = STICKER_SIZE[kind];
  const { canvas, ctx } = surface(w, h);
  const rand = seeded(kind.length * 31 + kind.charCodeAt(0) * 7 + kind.charCodeAt(1));
  const pad = 6;
  const round = kind === 'four' || kind === 'orb' || kind === 'heart' || kind === 'smile';
  const tear: Array<[number, number]> = [];

  if (kind === 'berlin') {
    const r = 10;
    const from: [number, number] = [w - 168, pad];
    const to: [number, number] = [w - pad, 118];
    ctx.beginPath();
    ctx.moveTo(pad + r, pad);
    ctx.lineTo(from[0], from[1]);
    const steps = 13;
    for (let i = 0; i <= steps; i += 1) {
      const k = i / steps;
      const jitter = i === 0 || i === steps ? 0 : (rand() - 0.5) * 18;
      const point: [number, number] = [from[0] + (to[0] - from[0]) * k + jitter * 0.58, from[1] + (to[1] - from[1]) * k - jitter * 0.82];
      tear.push(point);
      ctx.lineTo(point[0], point[1]);
    }
    ctx.lineTo(w - pad, h - pad - r);
    ctx.quadraticCurveTo(w - pad, h - pad, w - pad - r, h - pad);
    ctx.lineTo(pad + r, h - pad);
    ctx.quadraticCurveTo(pad, h - pad, pad, h - pad - r);
    ctx.lineTo(pad, pad + r);
    ctx.quadraticCurveTo(pad, pad, pad + r, pad);
    ctx.closePath();
  } else if (round) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - pad, 0, Math.PI * 2);
    ctx.closePath();
  } else {
    roundedPath(ctx, pad, pad, w - pad * 2, h - pad * 2, 12);
  }
  ctx.save();
  ctx.clip();

  const papers: Record<StickerKind, string> = {
    berlin: '#e7dcba',
    four: '#e2d5a6',
    name: '#ebe2c8',
    orb: '#10302f',
    kotti: '#e8c53a',
    heart: '#f0ece2',
    soft: '#141414',
    smile: '#f0c93a',
  };
  ctx.fillStyle = papers[kind];
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (kind === 'berlin') {
    ctx.strokeStyle = 'rgba(168,40,31,0.86)';
    ctx.lineWidth = 7;
    ctx.strokeRect(26, 26, w - 52, h - 52);
    ctx.fillStyle = 'rgba(28,26,23,0.92)';
    ctx.font = '900 112px "Arial Black", "Helvetica Neue", Arial, sans-serif';
    const fit = Math.min(1, (w - 100) / ctx.measureText('BERLIN').width);
    ctx.save();
    ctx.translate(w / 2, h / 2 + 6);
    ctx.scale(fit, 1);
    ctx.fillText('BERLIN', 0, 0);
    ctx.restore();
  } else if (kind === 'four') {
    ctx.strokeStyle = 'rgba(14,79,79,0.9)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 104, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(14,79,79,0.92)';
    ctx.font = '900 168px "Arial Black", "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('4', w / 2 - 4, h / 2 + 10);
  } else if (kind === 'name') {
    ctx.fillStyle = 'rgba(26,26,26,0.9)';
    ctx.font = '500 88px "JetBrains Mono", ui-monospace, Menlo, monospace';
    ctx.fillText('aileena', w / 2, h / 2 - 6);
    ctx.fillRect(70, h - 44, w - 140, 3);
  } else if (kind === 'orb') {
    const g = ctx.createRadialGradient(w * 0.42, h * 0.38, 6, w / 2, h / 2, w * 0.4);
    g.addColorStop(0, '#d8fff4');
    g.addColorStop(0.35, '#3fb8a6');
    g.addColorStop(1, '#0e4f4f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.33, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'kotti') {
    ctx.fillStyle = '#141414';
    ctx.font = '900 104px "Arial Black", "Helvetica Neue", Arial, sans-serif';
    const fit = Math.min(1, (w - 70) / ctx.measureText('KOTTI 36').width);
    ctx.save();
    ctx.translate(w / 2, h / 2 + 4);
    ctx.scale(fit, 1);
    ctx.fillText('KOTTI 36', 0, 0);
    ctx.restore();
    ctx.fillRect(24, 22, w - 48, 8);
    ctx.fillRect(24, h - 30, w - 48, 8);
  } else if (kind === 'heart') {
    ctx.fillStyle = '#c4161f';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.76);
    ctx.bezierCurveTo(w * 0.1, h * 0.5, w * 0.24, h * 0.16, w / 2, h * 0.36);
    ctx.bezierCurveTo(w * 0.76, h * 0.16, w * 0.9, h * 0.5, w / 2, h * 0.76);
    ctx.fill();
  } else if (kind === 'soft') {
    ctx.fillStyle = '#efe8dc';
    ctx.font = '500 46px "JetBrains Mono", ui-monospace, Menlo, monospace';
    ctx.fillText('soft strange technical', w / 2, h / 2);
  } else {
    ctx.strokeStyle = '#141414';
    ctx.fillStyle = '#141414';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 6, 78, 0.2, Math.PI - 0.2);
    ctx.stroke();
    for (const x of [w / 2 - 44, w / 2 + 44]) {
      ctx.beginPath();
      ctx.ellipse(x, h / 2 - 40, 11, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 16; i += 1) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 30 + rand() * 120;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(90,70,40,${0.05 + rand() * 0.1})`);
    g.addColorStop(1, 'rgba(90,70,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 80; i += 1) {
    const x = rand() * w;
    const y = rand() * h;
    const len = 6 + rand() * 46;
    const angle = (rand() - 0.5) * 0.9;
    ctx.strokeStyle = `rgba(236,228,206,${0.3 + rand() * 0.45})`;
    ctx.lineWidth = 0.6 + rand() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  for (let i = 0; i < 1200; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(60,44,20,0.1)' : 'rgba(255,250,236,0.14)';
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 1.6, 1 + rand() * 1.6);
  }
  if (tear.length) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(250,246,234,0.95)';
    ctx.lineWidth = 16;
    ctx.beginPath();
    tear.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.restore();
  return canvas;
}
