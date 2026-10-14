'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element */
// Interactive, client-only tamper-check lab. Engine is a JS port of github.com/lilaclilac09/tamper-check (same rules, same tests).
import { useEffect, useRef, useState } from 'react';
import * as TC from '../../lib/tools/tamperCheck/engine.js';
const score = (TC as any).score as (m: any) => any;
const comFromTwoScales = (TC as any).comFromTwoScales as (...a: any[]) => any;
import { REFERENCE } from '../../lib/tools/tamperCheck/reference.js';

type Ref = { name: string; weight_g: number; dims_mm: number[]; weight_tol_g: number; com_tol_mm: number };
const REFS = REFERENCE as Record<string, Ref>;
const MODELS: [string, string][] = [['ledger-nano-s-plus', 'Nano S Plus'], ['ledger-nano-x', 'Nano X'], ['ledger-stax', 'Stax'], ['ledger-flex', 'Flex']];
const IMG = '/tools/tamper-check/';
const ink = '#1d2a4a';

function useCount(target: number | null, ms = 700) {
  const [v, setV] = useState<number | null>(target);
  useEffect(() => {
    if (target == null) { setV(null); return; }
    let raf = 0; const t0 = performance.now();
    const k = (t: number) => { const u = Math.min(1, (t - t0) / ms); setV(target * (0.5 - 0.5 * Math.cos(Math.PI * u))); if (u < 1) raf = requestAnimationFrame(k); };
    raf = requestAnimationFrame(k); return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** Top-down illustration of the selected Ledger, drawn to scale (px per mm). */
function Wallet({ model, ppm, cx, cy, rot }: { model: string; ppm: number; cx: number; cy: number; rot: number }) {
  const [L, Wd] = REFS[model].dims_mm; const w = L * ppm, h = Wd * ppm, x = cx - w / 2, y = cy - h / 2;
  const stick = model.includes('nano');
  return (
    <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform 1.1s ease-in-out' }} data-testid="tc-wallet">
      <rect x={x + 3} y={y + 4} width={w} height={h} rx={stick ? h / 2.4 : 10} fill="rgba(0,0,0,0.25)" />
      {stick ? (
        <>
          <rect x={x} y={y} width={w} height={h} rx={h / 2.4} fill="#1b1d21" />
          <rect x={x + w * 0.12} y={y + h * 0.2} width={w * 0.42} height={h * 0.6} rx={4} fill="#06080b" stroke="#2c3440" />
          <circle cx={x + w * 0.83} cy={cy} r={h * 0.3} fill="#7d8187" stroke="#c9ccd1" strokeWidth={2} />
          <rect x={x + w * 0.02} y={y - h * 0.08} width={w * 0.7} height={h * 1.16} rx={h / 2.4} fill="url(#steel)" opacity={0.92} />
          <text x={x + w * 0.37} y={cy + 6} textAnchor="middle" fontSize={h * 0.32} fill="#e9ecef" letterSpacing={3}>LEDGER</text>
        </>
      ) : (
        <>
          <rect x={x} y={y} width={w} height={h} rx={12} fill={model === 'ledger-stax' ? '#f1f1ef' : '#2b2e33'} stroke="#8a8f96" strokeWidth={2} />
          <rect x={x + w * 0.06} y={y + h * 0.08} width={w * 0.74} height={h * 0.84} rx={8} fill={model === 'ledger-stax' ? '#fbfbf9' : '#e9e9e4'} stroke="#c8c8c2" />
          <text x={x + w * 0.43} y={cy + 5} textAnchor="middle" fontSize={14} fill="#666">E Ink</text>
          <rect x={x + w * 0.84} y={y + h * 0.15} width={w * 0.1} height={h * 0.7} rx={5} fill={model === 'ledger-stax' ? '#d5d5d0' : '#4a4e55'} />
        </>
      )}
      {/* orientation tag so the 180° turn is visible */}
      <rect x={x + w - 8} y={y + 6} width={5} height={h - 12} rx={2} fill="#27c26c" />
    </g>
  );
}

function Scale({ x, y, s, value, label, testid }: { x: number; y: number; s: number; value: string; label?: string; testid: string }) {
  return (
    <g>
      <rect x={x + 6} y={y + 10} width={s} height={s} rx={18} fill="rgba(0,0,0,0.28)" />
      <rect x={x} y={y} width={s} height={s} rx={18} fill="#17181b" stroke="#2c2e33" strokeWidth={3} />
      <rect x={x + 8} y={y + 8} width={s - 16} height={s - 16} rx={12} fill="#1e2024" />
      <text x={x + s / 2} y={y + 34} textAnchor="middle" fill="#cfd2d6" fontSize={18} fontWeight={700} letterSpacing={4}>mg SCALE</text>
      <rect x={x + s * 0.16} y={y + s - 78} width={s * 0.68} height={56} rx={6} fill="#0a1a10" stroke="#30443a" />
      <text x={x + s * 0.5} y={y + s - 37} textAnchor="middle" fill="#7dff95" fontSize={38} fontFamily="ui-monospace,monospace" fontWeight={700} data-testid={testid}>{value}</text>
      <text x={x + s * 0.88} y={y + s - 38} textAnchor="middle" fill="#7dff95" fontSize={16}>g</text>
      {label ? <text x={x + s / 2} y={y + s + 30} textAnchor="middle" fill="#333" fontSize={20} fontWeight={700}>{label}</text> : null}
    </g>
  );
}

export default function TamperCheckLab() {
  const [model, setModel] = useState('ledger-flex');
  const ref = REFS[model];
  // step 1
  const [tared1, setTared1] = useState(false);
  const [on1, setOn1] = useState(false);
  const [shown1, setShown1] = useState<number | null>(null);
  const [inp1, setInp1] = useState('');
  const [notes, setNotes] = useState<number[]>([]);
  const lcd1 = useCount(shown1);
  const [msg1, setMsg1] = useState('Press TARE: the empty scale must read 0.000 g.');
  async function weigh() {
    const v = parseFloat(inp1);
    if (!tared1) { setMsg1('Tare first: the display must read 0.000 g.'); return; }
    if (!(v > 0)) { setMsg1('Type the number your scale shows, e.g. 57.007'); return; }
    const base = notes.length >= 3 ? [] : notes;
    setOn1(true); await new Promise((r) => setTimeout(r, 450)); setShown1(v);
    await new Promise((r) => setTimeout(r, 900)); setNotes([...base, v]); setInp1('');
    await new Promise((r) => setTimeout(r, 600)); setOn1(false); setShown1(null); setTared1(false);
    setMsg1(base.length + 1 < 3 ? `Reading ${base.length + 1} of 3 written down. Lift the wallet, TARE again, weigh again.` : 'Three readings. Compare the average with the reference.');
  }
  const avg = notes.length === 3 ? notes.reduce((a, b) => a + b, 0) / 3 : null;
  const r1 = avg != null ? score({ model, scale_readings_g: notes, scale_resolution_g: 0.001 }) : null;

  // step 2
  const [tared2, setTared2] = useState(false);
  const [placed2, setPlaced2] = useState(false);
  const [rot, setRot] = useState(0);
  const [f, setF] = useState({ L: '', R: '', L2: '', R2: '', span: '100' });
  const n = (s: string) => parseFloat(s);
  const curL = rot ? n(f.L2) : n(f.L), curR = rot ? n(f.R2) : n(f.R);
  const disp = (v: number) => (!tared2 ? '- - -' : !placed2 ? '0.000' : v > 0 ? v.toFixed(3) : '…');
  let two: any = null, r2: any = null;
  if (n(f.L) + n(f.R) > 0) {
    const flipped = n(f.L2) + n(f.R2) > 0;
    try {
      two = comFromTwoScales(n(f.L), n(f.R), n(f.span) || 100, flipped ? n(f.L2) : null, flipped ? n(f.R2) : null);
      if (flipped) r2 = score({ model, two_scale: { left_g: n(f.L), right_g: n(f.R), left2_g: n(f.L2), right2_g: n(f.R2), span_mm: n(f.span) || 100 } });
    } catch { two = null; }
  }
  const com2 = r2?.warnings.find((w: any) => w.check === 'center_of_mass');
  const heavyFollows = two?.flipped && Math.sign(n(f.R) - n(f.L)) !== Math.sign(n(f.R2) - n(f.L2)) && Math.abs(two.offset_mm) > ref.com_tol_mm;
  const vc = (r: any) => (r.risk >= 60 ? '#e5484d' : r.risk >= 25 ? '#d29922' : '#1f9d55');
  const reset = () => { setNotes([]); setTared1(false); setShown1(null); setOn1(false); setTared2(false); setPlaced2(false); setRot(0); setF({ L: '', R: '', L2: '', R2: '', span: '100' }); };
  useEffect(reset, [model]);
  const box: React.CSSProperties = { background: '#fff', border: '1px solid #ddd', borderRadius: 14, padding: 16, marginBottom: 18, boxShadow: '0 2px 10px rgba(0,0,0,.06)' };
  const btn: React.CSSProperties = { background: '#111', color: '#fff', border: 0, borderRadius: 8, padding: '8px 14px', margin: '4px 6px 4px 0', cursor: 'pointer', fontWeight: 600 };
  const inp: React.CSSProperties = { border: '1px solid #bbb', borderRadius: 8, padding: '8px 10px', width: 110, fontSize: 18, fontFamily: 'ui-monospace,monospace' };
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 20px 60px', color: '#111', background: '#f6f5f2', borderRadius: 18, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@font-face{font-family:'TCHand';src:url(${IMG}PatrickHand.ttf) format('truetype');font-display:swap}`}</style>
      <a href="/tools" style={{ color: '#555', fontSize: 14 }}>← Tools</a>
      <h1 style={{ fontSize: 34, margin: '6px 0 4px' }}>Tamper Check: weigh before you trust</h1>
      <p style={{ color: '#555', margin: '0 0 14px' }}>A milligram scale can see what Ledger Genuine Check can&apos;t: an extra board adds mass. Type what your scale shows; everything is computed in your browser. Reference weights are <b>examples</b>; calibrate against a unit bought direct from ledger.com.</p>
      <div style={{ ...box, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <b>Your device</b>
        {MODELS.map(([k, label]) => (
          <button key={k} onClick={() => setModel(k)} data-testid={`tc-model-${k}`} style={{ ...btn, background: k === model ? '#111' : '#eee', color: k === model ? '#fff' : '#111' }}>{label}</button>
        ))}
        <img src={`${IMG}${model}.jpg`} alt={`Ledger ${ref.name} (official product image, ledger.com)`} style={{ height: 84, borderRadius: 8, border: '1px solid #eee' }} />
        <span style={{ fontSize: 12, color: '#777' }}>Image: shop.ledger.com · example reference {ref.weight_g.toFixed(3)} g ± {ref.weight_tol_g.toFixed(3)}</span>
      </div>

      <section style={box} data-testid="tc-step1">
        <h2 style={{ margin: '0 0 6px' }}>1 · Weigh it three times</h2>
        <svg ref={svgRef} viewBox="0 0 1000 520" style={{ width: '100%', borderRadius: 12, display: 'block' }}>
          <defs>
            <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c5c8cc" /><stop offset=".5" stopColor="#8d9298" /><stop offset="1" stopColor="#b7bbc0" /></linearGradient>
            <pattern id="lines" width="10" height="34" patternUnits="userSpaceOnUse"><line x1="0" y1="33" x2="10" y2="33" stroke="#9fc3e6" /></pattern>
          </defs>
          <image href={`${IMG}marble.jpg`} x={0} y={0} width={1000} height={520} preserveAspectRatio="xMidYMid slice" />
          <Scale x={120} y={70} s={380} value={!tared1 && lcd1 == null ? '- - -' : (lcd1 ?? 0).toFixed(3)} testid="tc-lcd1" />
          <g style={{ transform: `translateY(${on1 ? 0 : -420}px)`, transition: 'transform .45s ease-out', opacity: on1 ? 1 : 0 }}>
            <Wallet model={model} ppm={model.includes('nano') ? 4 : 3.4} cx={310} cy={220} rot={0} />
          </g>
          <g transform="rotate(-3 790 260)">
            <rect x={600} y={60} width={340} height={400} fill="#fffef2" stroke="#e2dfc8" />
            <rect x={600} y={60} width={340} height={400} fill="url(#lines)" opacity={0.7} />
            <line x1={640} y1={60} x2={640} y2={460} stroke="#f2a1a1" />
            <text x={655} y={100} fontFamily="TCHand, cursive" fontSize={28} fill={ink}>{REFS[model].name.replace(' (EXAMPLE values)', '')}</text>
            {notes.map((v, i) => (
              <text key={i} x={655} y={150 + i * 40} fontFamily="TCHand, cursive" fontSize={32} fill={ink} data-testid={`tc-note-${i}`}>#{i + 1}   {v.toFixed(3)} g</text>
            ))}
            {avg != null ? (
              <>
                <line x1={650} y1={262} x2={900} y2={262} stroke={ink} strokeWidth={2} />
                <text x={655} y={300} fontFamily="TCHand, cursive" fontSize={32} fill={ink} data-testid="tc-avg">avg  {avg.toFixed(3)} g</text>
                <text x={655} y={344} fontFamily="TCHand, cursive" fontSize={28} fill="#555">ref  {ref.weight_g.toFixed(3)} g (example)</text>
                <text x={655} y={392} fontFamily="TCHand, cursive" fontSize={36} fill={r1 ? vc(r1) : ink}>Δ {(avg - ref.weight_g >= 0 ? '+' : '') + (avg - ref.weight_g).toFixed(3)} g</text>
              </>
            ) : null}
          </g>
        </svg>
        <div style={{ marginTop: 10 }}>
          <button style={btn} onClick={() => { setTared1(true); setShown1(null); setMsg1('Tared: 0.000 g. Place the wallet and type the reading.'); }} data-testid="tc-tare1">TARE</button>
          <input style={inp} value={inp1} onChange={(e) => setInp1(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && weigh()} placeholder="57.007" inputMode="decimal" data-testid="tc-in1" />
          <button style={btn} onClick={weigh} data-testid="tc-weigh">Place & read</button>
          <button style={{ ...btn, background: '#888' }} onClick={() => { setNotes([]); setTared1(false); }}>Reset</button>
          <span style={{ marginLeft: 8, color: '#444' }}>{msg1}</span>
        </div>
        {r1 ? <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800, color: vc(r1) }} data-testid="tc-v1">{r1.verdict} <span style={{ fontSize: 14, color: '#555', fontWeight: 400 }}>risk {r1.risk}/100 · tolerance ±{ref.weight_tol_g.toFixed(3)} g (example)</span></div> : null}
      </section>

      <section style={box} data-testid="tc-step2">
        <h2 style={{ margin: '0 0 6px' }}>2 · Find the center of mass: two scales + a ruler</h2>
        <svg viewBox="0 0 1000 470" style={{ width: '100%', borderRadius: 12, display: 'block' }}>
          <image href={`${IMG}marble.jpg`} x={0} y={0} width={1000} height={470} preserveAspectRatio="xMidYMid slice" />
          <Scale x={60} y={110} s={260} value={disp(curL)} label="LEFT" testid="tc-lcdL" />
          <Scale x={680} y={110} s={260} value={disp(curR)} label="RIGHT" testid="tc-lcdR" />
          <rect x={150} y={150} width={700} height={42} rx={4} fill="#d9dde2" stroke="#9aa1a9" />
          {Array.from({ length: 36 }, (_, i) => <line key={i} x1={160 + i * 19.4} y1={150} x2={160 + i * 19.4} y2={i % 5 ? 160 : 168} stroke="#555" />)}
          <line x1={500} y1={146} x2={500} y2={198} stroke="#27c26c" strokeWidth={3} />
          <text x={500} y={138} textAnchor="middle" fontSize={15} fill="#1f7a45" fontWeight={700}>middle of the ruler</text>
          {placed2 ? <Wallet model={model} ppm={model.includes('nano') ? 3.4 : 2.7} cx={500} cy={171} rot={rot} /> : null}
          {two ? (
            <g style={{ transition: 'transform .6s' }} transform={`translate(${Math.max(-300, Math.min(300, two.offset_mm * 40))},0)`}>
              <circle cx={500} cy={171} r={11} fill="#ffd33d" stroke="#8a6d00" strokeWidth={2} data-testid="tc-com" />
            </g>
          ) : null}
          {two ? <text x={500} y={455} textAnchor="middle" fontSize={16} fill="#333">yellow = measured center of mass (shift ×40) · green = middle</text> : null}
        </svg>
        <div style={{ marginTop: 10, lineHeight: 2.2 }}>
          <button style={btn} onClick={() => { setTared2(true); setPlaced2(false); }} data-testid="tc-tare2">Ruler on · TARE BOTH</button>
          <button style={btn} onClick={() => tared2 && setPlaced2(true)} data-testid="tc-place2">Place wallet in the middle</button>
          L <input style={inp} value={f.L} onChange={(e) => setF({ ...f, L: e.target.value })} placeholder="28.504" data-testid="tc-L" />
          R <input style={inp} value={f.R} onChange={(e) => setF({ ...f, R: e.target.value })} placeholder="28.504" data-testid="tc-R" />
          <br />
          <button style={btn} onClick={() => placed2 && setRot(180)} data-testid="tc-rot">Rotate 180° in place</button>
          L <input style={inp} value={f.L2} onChange={(e) => setF({ ...f, L2: e.target.value })} disabled={!rot} placeholder="after rotating" data-testid="tc-L2" />
          R <input style={inp} value={f.R2} onChange={(e) => setF({ ...f, R2: e.target.value })} disabled={!rot} placeholder="after rotating" data-testid="tc-R2" />
          span <input style={{ ...inp, width: 70 }} value={f.span} onChange={(e) => setF({ ...f, span: e.target.value })} /> mm
          <button style={{ ...btn, background: '#888' }} onClick={() => { setTared2(false); setPlaced2(false); setRot(0); setF({ L: '', R: '', L2: '', R2: '', span: '100' }); }}>Reset</button>
        </div>
        {two ? (
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 16, marginTop: 6 }} data-testid="tc-offset">
            x = (R−L)/(R+L) × span/2 → x1 = {two.x1_mm.toFixed(2)} mm{two.flipped ? <> · x2 = {two.x2_mm.toFixed(2)} mm · <b>offset = (x1−x2)/2 = {(two.offset_mm >= 0 ? '+' : '') + two.offset_mm.toFixed(2)} mm</b> · placement {two.placement_mm.toFixed(2)} mm cancelled</> : ' · now rotate 180° and read again'}
          </div>
        ) : null}
        {r2 ? (
          <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800, color: com2?.severity === 'ok' ? '#1f9d55' : com2?.severity === 'high' ? '#e5484d' : '#d29922' }} data-testid="tc-v2">
            {com2?.severity === 'ok' ? 'CENTRED ✓' : 'OFF-CENTRE ✗'} <span style={{ fontSize: 14, color: '#555', fontWeight: 400 }}>offset {Math.abs(two.offset_mm).toFixed(2)} mm vs tolerance {ref.com_tol_mm} mm (example)</span>
            <div style={{ fontSize: 15, color: '#333', fontWeight: 500 }}>{Math.abs(two.offset_mm) <= ref.com_tol_mm ? 'Equal before and after rotating: the mass is centred.' : heavyFollows ? 'The heavy side followed the wallet when you rotated it: extra mass inside that end.' : 'Center of mass is off-centre beyond tolerance.'}</div>
          </div>
        ) : null}
      </section>
      <p style={{ fontSize: 13, color: '#666' }}>Until it&apos;s verified, keep the wallet in a Faraday bag (test the bag: call a phone inside it). Open source: <a href="https://github.com/lilaclilac09/tamper-check">github.com/lilaclilac09/tamper-check</a>. Product images © Ledger, from shop.ledger.com.</p>
    </main>
  );
}
