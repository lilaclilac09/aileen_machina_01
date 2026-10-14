'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// Tamper Check: type your scale readings, get a verdict. Client-only; engine is a JS port of github.com/lilaclilac09/tamper-check.
import { useState } from 'react';
import * as TC from '../../lib/tools/tamperCheck/engine.js';
import { REFERENCE } from '../../lib/tools/tamperCheck/reference.js';

const score = (TC as any).score as (m: any) => any;
const comFromTwoScales = (TC as any).comFromTwoScales as (...a: any[]) => any;
type Ref = { name: string; weight_g: number; weight_tol_g: number; com_tol_mm: number };
const REFS = REFERENCE as Record<string, Ref>;
const MODELS: [string, string][] = [['ledger-nano-s-plus', 'Nano S Plus'], ['ledger-nano-x', 'Nano X'], ['ledger-stax', 'Stax'], ['ledger-flex', 'Flex']];
const GREEN = '#15803d', AMBER = '#b45309', RED = '#b91c1c';
const num = (s: string) => parseFloat(s.replace(',', '.'));

const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 16, padding: 24, marginBottom: 22 };
const inp: React.CSSProperties = { border: '2px solid #ccc', borderRadius: 10, padding: '10px 12px', width: 150, fontSize: 26, fontFamily: 'ui-monospace,monospace', textAlign: 'center' };
const lab: React.CSSProperties = { display: 'block', fontSize: 14, color: '#555', marginBottom: 4, fontWeight: 600 };

/** One step of the two-scale setup, drawn top-down. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#f7f7f5', borderRadius: 12, padding: 12, minWidth: 0, height: 'auto', overflow: 'visible' }}>
      <svg viewBox="0 0 240 130" style={{ width: '100%', height: 'auto', display: 'block' }}>{children}</svg>
      <div style={{ fontSize: 15, lineHeight: 1.4, marginTop: 6, whiteSpace: 'normal', overflow: 'visible' }}><b>{n}.</b> {title}</div>
    </div>
  );
}
const ScaleL = ({ v }: { v?: string }) => (<g><rect x={10} y={40} width={70} height={70} rx={8} fill="#1b1c1f" /><rect x={18} y={84} width={54} height={20} rx={3} fill="#0b2213" /><text x={45} y={99} textAnchor="middle" fontSize={13} fill="#7dff95" fontFamily="monospace">{v ?? '0.000'}</text></g>);
const ScaleR = ({ v }: { v?: string }) => (<g><rect x={160} y={40} width={70} height={70} rx={8} fill="#1b1c1f" /><rect x={168} y={84} width={54} height={20} rx={3} fill="#0b2213" /><text x={195} y={99} textAnchor="middle" fontSize={13} fill="#7dff95" fontFamily="monospace">{v ?? '0.000'}</text></g>);
const Ruler = () => (<g><rect x={20} y={52} width={200} height={12} rx={2} fill="#d6d9de" stroke="#8a9099" /><line x1={120} y1={46} x2={120} y2={70} stroke={GREEN} strokeWidth={3} /></g>);
const Wallet = ({ flip }: { flip?: boolean }) => (<g transform={flip ? 'rotate(180 120 58)' : undefined}><rect x={92} y={44} width={56} height={28} rx={5} fill="#2b2e33" /><rect x={97} y={49} width={30} height={18} rx={2} fill="#e9e9e4" /><rect x={142} y={46} width={4} height={24} rx={2} fill={GREEN} /></g>);

const Conf = ({ c }: { c: number }) => (<span data-testid="tc-conf" style={{ display: 'inline-block', fontSize: 15, fontWeight: 800, padding: '4px 12px', borderRadius: 999, background: c === 2 ? '#111' : c === 1 ? '#555' : '#ddd', color: c === 0 ? '#111' : '#fff', marginLeft: 10, verticalAlign: 'middle' }}>CONFIDENCE: {['LOW','MEDIUM','HIGH'][c]}</span>);

export default function TamperCheckLab() {
  const [model, setModel] = useState('ledger-flex');
  const ref = REFS[model];
  const [w, setW] = useState(['', '', '']);
  const readings = w.map(num).filter((x) => x > 0);
  const r1 = readings.length ? score({ model, scale_readings_g: readings, scale_resolution_g: 0.001 }) : null;
  const avg = readings.length ? readings.reduce((a, b) => a + b, 0) / readings.length : null;
  const d = avg != null ? avg - ref.weight_g : null;
  const v1 = r1 ? (r1.risk >= 60 ? ['TAMPERED: DO NOT USE', RED] : r1.risk >= 25 ? ['TOO HEAVY: SUSPICIOUS', AMBER] : ['LOOKS GENUINE', GREEN]) : null;

  const [f, setF] = useState({ L: '', R: '', L2: '', R2: '', span: '100' });
  let two: any = null;
  try { if (num(f.L) > 0 && num(f.R) > 0) two = comFromTwoScales(num(f.L), num(f.R), num(f.span) || 100, num(f.L2) > 0 && num(f.R2) > 0 ? num(f.L2) : null, num(f.L2) > 0 && num(f.R2) > 0 ? num(f.R2) : null); } catch { two = null; }
  const off = two ? Math.abs(two.offset_mm) : 0;
  const v2 = two?.flipped ? (off <= ref.com_tol_mm ? ['CENTRED', GREEN] : off <= 2 * ref.com_tol_mm ? ['OFF-CENTRE', AMBER] : ['OFF-CENTRE', RED]) : null;
  const follows = two?.flipped && Math.sign(num(f.R) - num(f.L)) !== Math.sign(num(f.R2) - num(f.L2)) && off > ref.com_tol_mm;

  // Confidence (example rules, see "How we judge")
  const absd = d != null ? Math.abs(d) : 0, tol = ref.weight_tol_g;
  const wFlag = d != null && absd > tol, cFlag = !!v2 && off > ref.com_tol_mm, cOk = !!v2 && !cFlag;
  let c1 = -1;
  if (d != null) {
    c1 = d >= 0.3 - 1e-6 ? 2 : absd > 2 * tol ? 1 : absd > tol ? 0 : 1;
    if (readings.length < 3 && c1 < 2) c1 = Math.max(0, c1 - 1);
    if ((wFlag && cFlag) || (!wFlag && cOk && readings.length >= 3)) c1 = 2;
  }
  let c2 = -1;
  if (v2) { c2 = off > 2 * ref.com_tol_mm ? 1 : off > ref.com_tol_mm ? 0 : 1; if (follows) c2 = Math.max(c2, 1); if ((wFlag && cFlag) || (d != null && !wFlag && cOk)) c2 = 2; }
  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #111', fontSize: 14 };
  const td: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #e5e5e5', fontSize: 15, verticalAlign: 'top' };
  const rows: [string, string, string, string][] = [
    ['Weight Δ within ±' + tol.toFixed(3) + ' g', 'Normal', GREEN, 'Medium (High if CoM is also centred)'],
    ['Weight Δ > ' + tol.toFixed(3) + ' g', 'Slightly heavy: suspicious', AMBER, 'Low'],
    ['Weight Δ > ' + (2 * tol).toFixed(3) + ' g (2× tolerance)', 'Significant: suspicious', AMBER, 'Medium'],
    ['Weight Δ ≥ +0.300 g (board-sized)', 'TAMPERED: DO NOT USE', RED, 'High'],
    ['CoM offset ≤ ' + ref.com_tol_mm.toFixed(1) + ' mm', 'Centred', GREEN, 'Medium'],
    ['CoM offset ' + ref.com_tol_mm.toFixed(1) + '–' + (2 * ref.com_tol_mm).toFixed(1) + ' mm', 'Mild off-centre', AMBER, 'Low'],
    ['CoM offset > ' + (2 * ref.com_tol_mm).toFixed(1) + ' mm', 'Significant off-centre', RED, 'Medium'],
    ['Heavy side follows the wallet after 180°', 'Mass is inside the device', RED, 'Medium or higher'],
  ];

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 60px', color: '#111', background: '#f6f5f2', borderRadius: 18, fontFamily: 'system-ui, sans-serif' }}>
      <a href="/tools" style={{ color: '#555', fontSize: 14 }}>← Tools</a>
      <h1 style={{ fontSize: 36, margin: '6px 0 6px' }}>Tamper Check</h1>
      <p style={{ fontSize: 18, color: '#444', margin: '0 0 18px' }}>An implant board adds weight. Weigh your Ledger on a 0.001 g scale and type the numbers. Nothing leaves your browser.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {MODELS.map(([k, label]) => (
          <button key={k} onClick={() => setModel(k)} data-testid={`tc-model-${k}`} style={{ fontSize: 16, padding: '10px 18px', borderRadius: 999, border: '2px solid #111', background: k === model ? '#111' : '#fff', color: k === model ? '#fff' : '#111', fontWeight: 700, cursor: 'pointer' }}>{label}</button>
        ))}
      </div>

      <section style={card} data-testid="tc-step1">
        <h2 style={{ margin: '0 0 4px' }}>1 · Weigh it 3 times</h2>
        <p style={{ margin: '0 0 14px', color: '#555' }}>Tare the empty scale to 0.000 g, place the wallet, note the reading. Repeat 3 times.</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[0, 1, 2].map((i) => (
            <label key={i}><span style={lab}>Reading {i + 1} (g)</span>
              <input style={inp} inputMode="decimal" placeholder={ref.weight_g.toFixed(3)} value={w[i]} onChange={(e) => { const n = [...w]; n[i] = e.target.value; setW(n); }} data-testid={`tc-w${i}`} /></label>
          ))}
        </div>
        {avg != null && d != null && v1 ? (
          <div style={{ marginTop: 20 }} data-testid="tc-v1">
            <div style={{ fontSize: 20, fontFamily: 'ui-monospace,monospace' }}>average <b style={{ fontSize: 30 }}>{avg.toFixed(3)} g</b> · reference {ref.weight_g.toFixed(3)} g · <b style={{ fontSize: 30, color: v1[1] }}>Δ {(d >= 0 ? '+' : '') + d.toFixed(3)} g</b></div>
            <div style={{ fontSize: 44, fontWeight: 900, color: v1[1], marginTop: 6 }}>{v1[0]}<Conf c={c1} /></div>
            <div style={{ color: '#555' }}>Allowed difference ±{ref.weight_tol_g.toFixed(3)} g.{readings.length < 3 ? ' Add all 3 readings for a reliable result.' : ''} {r1.risk >= 25 ? 'Do not enter a seed on this device.' : ''}</div>
          </div>
        ) : null}
        <p style={{ fontSize: 13, color: '#777', margin: '14px 0 0' }}>Reference weights are examples. For a real check, weigh a unit bought direct from ledger.com on the same scale.</p>
      </section>

      <section style={card} data-testid="tc-step2">
        <h2 style={{ margin: '0 0 4px' }}>2 · Find where the extra mass is (two scales + a ruler)</h2>
        <div className="tc-steps" style={{ display: 'grid', gap: 12, margin: '12px 0 18px' }}>
          <Step n={1} title="Two scales side by side, a rigid ruler across both. Tare both to 0.000."><ScaleL /><ScaleR /><Ruler /></Step>
          <Step n={2} title="Put the wallet exactly on the ruler's middle mark."><ScaleL v="—" /><ScaleR v="—" /><Ruler /><Wallet /></Step>
          <Step n={3} title="Read Left and Right."><ScaleL v="28.517" /><ScaleR v="29.693" /><Ruler /><Wallet /></Step>
          <Step n={4} title="Rotate it 180° on the spot. Read Left and Right again."><ScaleL v="29.505" /><ScaleR v="28.705" /><Ruler /><Wallet flip /><path d="M120 22 a16 10 0 1 1 -1 0" fill="none" stroke={AMBER} strokeWidth={2.5} /><text x={120} y={18} textAnchor="middle" fontSize={11} fill={AMBER}>180°</text></Step>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label><span style={lab}>Left (g)</span><input style={inp} value={f.L} onChange={(e) => setF({ ...f, L: e.target.value })} data-testid="tc-L" /></label>
          <label><span style={lab}>Right (g)</span><input style={inp} value={f.R} onChange={(e) => setF({ ...f, R: e.target.value })} data-testid="tc-R" /></label>
          <label><span style={lab}>Left after 180° (g)</span><input style={inp} value={f.L2} onChange={(e) => setF({ ...f, L2: e.target.value })} data-testid="tc-L2" /></label>
          <label><span style={lab}>Right after 180° (g)</span><input style={inp} value={f.R2} onChange={(e) => setF({ ...f, R2: e.target.value })} data-testid="tc-R2" /></label>
          <label><span style={lab}>Distance between scale centres (mm)</span><input style={{ ...inp, width: 110 }} value={f.span} onChange={(e) => setF({ ...f, span: e.target.value })} /></label>
        </div>
        {two ? (
          <div style={{ marginTop: 20 }} data-testid="tc-v2">
            {v2 ? <div style={{ fontSize: 44, fontWeight: 900, color: v2[1] }}>{v2[0]}<Conf c={c2} /></div> : <div style={{ fontSize: 20, color: '#555' }}>Now rotate 180° and enter the second pair.</div>}
            {two.flipped ? <div style={{ fontSize: 20 }}>offset <b style={{ fontSize: 30 }}>{(two.offset_mm >= 0 ? '+' : '') + two.offset_mm.toFixed(2)} mm</b> (allowed ±{ref.com_tol_mm} mm)</div> : null}
            {v2 ? <div style={{ color: '#444', fontSize: 17, marginTop: 4 }}>{off <= ref.com_tol_mm ? 'Equal before and after rotating: the mass is centred.' : follows ? 'The heavy side moved with the wallet when you rotated it: extra mass inside that end.' : 'The balance point is off-centre.'}</div> : null}
          </div>
        ) : null}
      </section>

      <section style={card} data-testid="tc-criteria">
        <h2 style={{ margin: '0 0 4px' }}>How we judge</h2>
        <p style={{ margin: '0 0 12px', color: '#555' }}>Thresholds for the selected model ({ref.name}). All numbers are examples.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520 }}>
            <thead><tr><th style={th}>Measurement</th><th style={th}>Result</th><th style={th}>Confidence</th></tr></thead>
            <tbody>{rows.map(([m, r, c, k]) => (<tr key={m}><td style={td}>{m}</td><td style={{ ...td, color: c, fontWeight: 700 }}>{r}</td><td style={td}>{k}</td></tr>))}</tbody>
          </table>
        </div>
        <p style={{ margin: '14px 0 6px', fontSize: 15 }}><b>Confidence goes up when signals agree.</b> If the weight is high <i>and</i> the CoM is off-centre, confidence is High. A normal weight plus a centred CoM is also High. Fewer than 3 weight readings lowers confidence one level. A board-sized overweight (≥ 0.3 g) is High on its own.</p>
        <p style={{ margin: 0, fontSize: 14, color: '#777' }}>Reference weights and tolerances are examples, not Ledger specs. Calibrate with a known-genuine unit from the same batch, weighed on the same scale, and use its weight as your reference.</p>
      </section>

      <style>{`.tc-steps{grid-template-columns:repeat(4,minmax(0,1fr))}@media (max-width:760px){.tc-steps{grid-template-columns:repeat(2,minmax(0,1fr))}}`}</style>
      <p style={{ fontSize: 14, color: '#555' }}>Until it&apos;s verified, keep the wallet in a Faraday bag (test the bag: call a phone inside it). Open source: <a href="https://github.com/lilaclilac09/tamper-check">github.com/lilaclilac09/tamper-check</a></p>
    </main>
  );
}
