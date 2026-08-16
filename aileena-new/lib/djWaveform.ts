/** Peak bars from a decoded buffer. No third-party waveform lib. */

export function peaksFromBuffer(buffer: AudioBuffer, bars = 160): number[] {
  const ch = buffer.numberOfChannels > 0 ? buffer.getChannelData(0) : new Float32Array(0);
  if (ch.length === 0 || bars <= 0) return Array.from({ length: Math.max(1, bars) }, () => 0);
  const block = Math.max(1, Math.floor(ch.length / bars));
  const out: number[] = [];
  let peak = 0;
  for (let i = 0; i < bars; i++) {
    let max = 0;
    const start = i * block;
    const end = Math.min(ch.length, start + block);
    for (let j = start; j < end; j++) {
      const v = Math.abs(ch[j] ?? 0);
      if (v > max) max = v;
    }
    out.push(max);
    if (max > peak) peak = max;
  }
  if (peak > 0) {
    for (let i = 0; i < out.length; i++) out[i] = out[i] / peak;
  }
  return out;
}

export function rmsFromTimeDomain(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < bytes.length; i++) {
    const n = ((bytes[i] ?? 128) - 128) / 128;
    sum += n * n;
  }
  return Math.sqrt(sum / bytes.length);
}
