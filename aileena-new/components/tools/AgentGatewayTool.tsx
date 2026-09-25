'use client';

import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import ArcadeLayout, { mono } from './ArcadeLayout';

export default function AgentGatewayTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.agentGateway;

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee}>
      <div style={{ display: 'grid', gap: 28, maxWidth: 980 }}>
        <section style={panel} data-testid="agent-gateway-dashboard">
          <div style={rule} />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 14px 0' }}>
            <div>
              <div style={{ letterSpacing: '0.14em' }}>AGENT-GATEWAY</div>
              <div style={{ marginTop: 4, color: '#8B8680', fontSize: 12, letterSpacing: '0.08em' }}>LOCAL INGRESS · OFFICIAL KEYS ONLY</div>
            </div>
            <div style={{ color: '#8B8680', fontFamily: mono, fontSize: 12 }}>LIVE 127.0.0.1:8787</div>
          </div>
          <div style={{ padding: '12px 14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
              <Metric k="REQUESTS" v="3" />
              <Metric k="OK / ERR" v="2 / 1" />
              <Metric k="TOKENS IN / OUT" v="12 / 40" />
              <Metric k="UPTIME" v="3840s" />
            </div>
            <p style={{ margin: '12px 0', color: '#8B8680', fontFamily: mono, fontSize: 12 }}>USAGE</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: mono, fontSize: 12 }}>
              <thead>
                <tr>{['ID', 'RPM', 'TODAY', 'CAP'].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                <UsageRow id="owner" rpm="0 / 60" today="0" cap="0" />
                <UsageRow id="teammate" rpm="4 / 30" today="12840" cap="200000" />
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <p style={kicker}>{tx.dockerTitle}</p>
          <pre style={code}>{tx.docker}</pre>
        </section>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          {tx.cards.map((card) => (
            <article key={card.title} style={cardStyle}>
              <p style={{ ...kicker, color: '#8B8680' }}>{card.title}</p>
              <p style={{ margin: '8px 0 0', lineHeight: 1.45 }}>{card.body}</p>
            </article>
          ))}
        </section>
        <section>
          <p style={kicker}>{tx.notTitle}</p>
          <ul style={{ margin: '10px 0 0', paddingLeft: '1.1rem', display: 'grid', gap: 6 }}>
            {tx.not.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <section>
          <p style={kicker}>{tx.teammateTitle}</p>
          <pre style={code}>{tx.teammate}</pre>
        </section>
        <p style={{ margin: 0, color: 'rgba(20,17,12,0.58)', fontSize: '0.92rem' }}>{tx.runsLocal}</p>
        <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em' }}>
          <a href={tx.gitHref}>{tx.gitLabel}</a>
          {' · '}
          <a href={tx.readmeHref}>{tx.readmeLabel}</a>
          {' · '}
          <a href={tx.previewHref}>{tx.previewLabel}</a>
          {' · '}
          <a href={tx.useHref}>{tx.useLabel}</a>
        </p>
      </div>
    </ArcadeLayout>
  );
}

function Metric({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ background: '#14161A', border: '1px solid #2A2E34', padding: '12px 14px' }}>
      <div style={{ color: '#8B8680', fontSize: 11, letterSpacing: '0.08em' }}>{k}</div>
      <div style={{ marginTop: 8, fontFamily: mono, fontSize: 28 }}>{v}</div>
    </div>
  );
}

function UsageRow({ id, rpm, today, cap }: { id: string; rpm: string; today: string; cap: string }) {
  return (
    <tr>
      <td style={td}>{id}</td>
      <td style={td}>{rpm}</td>
      <td style={td}>{today}</td>
      <td style={td}>{cap}</td>
    </tr>
  );
}

const panel = {
  background: '#0B0C0E',
  color: '#E8E4DC',
  border: '1px solid #2A2E34',
};

const rule = { height: 2, background: '#E8B86D' };
const th = { textAlign: 'left' as const, color: '#8B8680', fontWeight: 500, padding: '8px 8px 8px 0', borderBottom: '1px solid #2A2E34' };
const td = { padding: '8px 8px 8px 0', borderBottom: '1px solid #2A2E34' };

const kicker = {
  margin: 0,
  fontFamily: mono,
  fontSize: '0.68rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'rgba(20,17,12,0.48)',
};

const code = {
  margin: '10px 0 0',
  padding: '14px 16px',
  background: '#0B0C0E',
  color: '#E8E4DC',
  fontFamily: mono,
  fontSize: '0.72rem',
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap' as const,
  overflowX: 'auto' as const,
};

const cardStyle = {
  background: '#14161A',
  color: '#E8E4DC',
  border: '1px solid #2A2E34',
  borderRadius: 0,
  padding: '12px 14px',
};
