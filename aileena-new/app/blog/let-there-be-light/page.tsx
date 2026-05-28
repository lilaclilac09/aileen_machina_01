'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function LetThereBeLightArticle() {
  return (
    <SubstackShell
      category="Investing"
      date="2026.05.31"
      tags="Optical Modules · AI Infra · Photonics · CPO"
      title="Let There Be Light Modules"
      dek="If the GPU is the brain of an AI cluster, the optical module is the nerve that lets the brains talk. It turns electricity into light, sends it down a fiber, and turns it back — and the whole build-out is gated by who can make the light. Here's what an optical module actually is, the routes racing to build it, and where the value gets stuck."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          &quot;Let there be light,&quot; and there was &mdash; an <strong style={strong}>optical
          module</strong>. In an AI cluster the famous part is the GPU, but a GPU on its own is an
          island. To make thousands of them work as one machine, every chip has to talk to every other
          chip and to the switches between them, fast, and copper wire hits a physical wall well before
          AI bandwidths. So the signal leaves the electrical world and travels as light. The optical
          module is the device that makes that jump &mdash; the high-speed connector wired between GPU
          and GPU, and between GPU and switch. Without it, all that compute can't communicate, and the
          cluster is bottlenecked. That's why, in the map of AI infrastructure, optical modules are a
          layer of their own &mdash; the &quot;blood vessels&quot; of compute, sitting alongside the
          silicon &quot;brain&quot; and the physical &quot;body&quot; of structure and cooling.
        </p>

        <SectionLabel>How the light gets made</SectionLabel>
        <p style={bodyStyle}>
          The mechanism is simple to picture and hard to build. It has three steps:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Transmit.</strong> The electrical signal from the server hits a
            light-making chip &mdash; typically an <strong style={strong}>EML</strong>
            (electro-absorption modulated laser) &mdash; which modulates it into a beam of light
            carrying the same information.
          </li>
          <li>
            <strong style={strong}>Travel.</strong> That light runs down an optical fiber: fast, far,
            and with very little loss.
          </li>
          <li>
            <strong style={strong}>Receive.</strong> At the far end a <strong style={strong}>PD</strong>
            (photodetector) chip turns the light back into an electrical signal the next device can use.
          </li>
        </ul>
        <p style={bodyStyle}>
          The cleanest analogy is a lighthouse: it sends a message by switching its lamp on and off
          (Morse code). An optical module does the same thing, just unimaginably faster &mdash; encoding
          data into the light's on/off, its brightness, even its phase and polarization.
        </p>

        <SectionLabel>The routes racing to build it</SectionLabel>
        <p style={bodyStyle}>
          There's no single winning design. To chase bandwidth, power and cost all at once, several
          technology routes are evolving in parallel &mdash; competing and combining:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Route</th>
                <th style={thStyle}>Core idea</th>
                <th style={thStyle}>Where it stands</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>EML (traditional)</td><td style={tdStyle}>the EML chip both emits and modulates the light &mdash; mature and reliable</td><td style={tdStyle}>today's mainstream, esp. beyond 2 km; the chip supply is the bottleneck</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Silicon photonics</td><td style={tdStyle}>build the optics in silicon &mdash; dense, cheap, low-power; needs an external CW laser for light</td><td style={tdStyle}>spreading fast; mainstream at 500 m / 2 km; 2025 was called the &quot;year of silicon photonics&quot;</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>LPO</td><td style={tdStyle}>linear-drive pluggable: drop the DSP chip and drive the laser directly &mdash; cuts power ~50%</td><td style={tdStyle}>a low-cost, low-power stopgap; &quot;silicon photonics + LPO&quot; is becoming the short-reach standard</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>CPO</td><td style={tdStyle}>co-packaged optics: put the optical engine right next to the switch chip; the signal travels mm, not cm</td><td style={tdStyle}>the long-term &quot;endgame&quot;; volume production not expected before ~2027 &mdash; for now, more concept than reality</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Micro LED</td><td style={tdStyle}>use Micro LEDs as the emitter, &quot;wide-and-slow&quot; across many channels for bandwidth at low cost</td><td style={tdStyle}>emerging, early, but feasible; cost could fall below ¥50 a module</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>OCS</td><td style={tdStyle}>optical circuit switch: tiny MEMS mirrors switch data in the light domain, skipping the electrical conversion</td><td style={tdStyle}>core to Google's TPU clusters; not a module itself, but it reshapes how many modules you need</td></tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>Where the light gets stuck (and where the value is)</SectionLabel>
        <p style={bodyStyle}>
          Follow the supply chain and the money pools exactly where the supply is tightest &mdash; the
          same lesson as the <Link href="/blog/ai-hardware-scarcity" style={linkStyle}>scarcity map</Link>:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Optical chips (EML / CW / pump laser).</strong> The core bottleneck.
            Dominated by a few foreign giants (Lumentum, Coherent), with orders booked into 2028 and a
            supply gap over 30%.
          </li>
          <li>
            <strong style={strong}>The optical engine.</strong> The value core &mdash; the assembled
            light-making heart &mdash; supplied by firms like T&amp;S Communications (天孚) into module
            makers such as Fabrinet and Innolight (旭创).
          </li>
          <li>
            <strong style={strong}>FAU (fiber array unit).</strong> The passive part that aligns the
            fiber to the optical chip. The precision bar is so high it's still almost entirely built by
            hand &mdash; a quiet, severe choke point.
          </li>
          <li>
            <strong style={strong}>Faraday rotators / isolators.</strong> The component that stops stray
            light reflecting back into the laser. Effectively a Coherent monopoly, kept strategically
            tight, slow to expand.
          </li>
        </ul>

        <SectionLabel>Where the light goes to work</SectionLabel>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Inside the data center (scale-out / scale-up).</strong> Linking GPUs
            to switches &mdash; the main use today, iterating fast from 800G toward 1.6T (gigabit to
            terabit per second).
          </li>
          <li>
            <strong style={strong}>Between data centers (DCI).</strong> Connecting sites tens to
            thousands of kilometers apart. Demand is exploding in steps, and the products carry high
            prices and high margins &mdash; the world the{' '}
            <Link href="/blog/nokia-dci" style={linkStyle}>Nokia / DCI piece</Link> is about.
          </li>
          <li>
            <strong style={strong}>Inside the rack (CPO / NPO).</strong> The next-generation move Nvidia
            and Google are pushing &mdash; pulling the optics off the faceplate and in next to the chip.
          </li>
        </ul>

        <SectionLabel>The whole picture — one mind map</SectionLabel>
        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>{`OPTICAL MODULE — turns electricity into light, and back again
│
├─ ROLE ............ the comms "nerves" between GPU "brains"
│                    GPU↔GPU, GPU↔switch; copper hits a wall, light doesn't
│
├─ HOW IT WORKS .... TX: EML chip modulates electricity → light
│                    → fiber (fast, far, low-loss) →
│                    RX: PD chip turns light back into electricity
│
├─ TECH ROUTES ..... EML ............. mature, mainstream, wins beyond 2 km
│                    Silicon photonic. dense / cheap / low-power (needs CW laser)
│                    LPO ............. drops the DSP, ~50% less power
│                    CPO ............. optics beside the chip — the endgame (~2027+)
│                    Micro LED ....... wide-and-slow, ultra-low cost (<¥50)
│                    OCS ............. switches in the light domain (Google TPU)
│
├─ BOTTLENECKS ..... optical chips (EML / CW / pump) — booked to 2028, >30% gap
│                    optical engine · FAU (hand-built) · isolator (Coherent)
│
└─ WHERE IT'S USED   in the DC (800G→1.6T) · DCI (long-haul) · in-rack (CPO/NPO)`}</pre>
        </div>

        <SectionLabel>The bottom line</SectionLabel>
        <p style={bodyStyle}>
          In the grand AI story, the GPU is the brain &mdash; it supplies the &quot;light of
          intelligence,&quot; the raw compute. The optical module is the nerve that connects those
          brains: the &quot;light of communication&quot; that lets compute work together and
          intelligence flow. Without it, the strongest GPU in the world is just an island. The
          competing routes &mdash; EML, silicon photonics, LPO, CPO, Micro LED &mdash; are all racing
          toward the same horizon: pulling the light closer and closer to the chip until the chip simply
          emits its own. And as ever, the edge isn't the cleverest design &mdash; it's owning the part
          of the light nobody else can make.
        </p>

        <p style={{ ...bodyStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 40 }}>
          An explainer built from optical-module supply-chain research; figures are stated as given in
          the source, not independently re-derived.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#investing" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Archive
          </Link>
        </div>

      </article>
    </SubstackShell>
  );
}

/* ── Shared inline styles ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const linkStyle: React.CSSProperties = { color: '#00ffea', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,234,0.3)' };
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 16px 10px 0',
  fontFamily: 'monospace',
  fontSize: '0.65rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 600,
};
const trStyle: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.07)' };
const tdLabelStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 600,
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.7)',
  verticalAlign: 'top',
  lineHeight: 1.55,
};
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};
const preStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.74rem',
  lineHeight: 1.7,
  color: 'rgba(255,255,255,0.75)',
  background: 'rgba(0,255,234,0.025)',
  border: '1px solid rgba(0,255,234,0.12)',
  padding: '20px 24px',
  overflowX: 'auto',
  letterSpacing: '0.01em',
  margin: 0,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'monospace',
      fontSize: '0.6rem',
      letterSpacing: '0.45em',
      color: '#00ffea',
      textTransform: 'uppercase',
      marginBottom: 20,
      marginTop: 56,
      opacity: 0.8,
    }}>
      {children}
    </p>
  );
}
