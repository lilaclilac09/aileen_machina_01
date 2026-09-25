'use client';

import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import ArcadeLayout, { mono } from './ArcadeLayout';

export default function AgentGatewayUse() {
  const { language } = useLanguage();
  const tx = t[language].tools.agentGatewayUse;

  return (
    <ArcadeLayout
      tag={tx.tag}
      title={tx.heading}
      subtitle={tx.body}
      marquee={tx.marquee}
      backLabel="← Agent-Gateway"
      backHref="/tools/agent-gateway"
    >
      <div style={{ display: 'grid', gap: 28, maxWidth: 720 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          {tx.roles.map((role) => (
            <article key={role.title} style={cardStyle}>
              <p style={metalKicker}>{role.title}</p>
              <p style={{ margin: '8px 0 0', lineHeight: 1.45 }}>{role.body}</p>
            </article>
          ))}
        </section>
        <section>
          <p style={kicker}>{tx.callerTitle}</p>
          <pre style={code}>{tx.caller}</pre>
          <p style={note}>{tx.callerNote}</p>
        </section>
        <section>
          <p style={kicker}>{tx.cursorTitle}</p>
          <p style={note}>{tx.cursorBody}</p>
          <pre style={code}>{tx.caller}</pre>
        </section>
        <section>
          <p style={kicker}>{tx.curlTitle}</p>
          <pre style={code}>{tx.curl}</pre>
        </section>
        <section>
          <p style={kicker}>{tx.failTitle}</p>
          <table style={table}>
            <tbody>
              {tx.fails.map((row) => (
                <tr key={row.code}>
                  <td style={codeCell}>{row.code}</td>
                  <td style={meanCell}>{row.mean}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <p style={kicker}>{tx.hourTitle}</p>
          <ol style={list}>
            {tx.hour.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section style={cardStyle}>
          <p style={metalKicker}>{tx.teachTitle}</p>
          <ol style={{ ...list, color: '#E8E4DC' }}>
            {tx.teach.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <p style={{ margin: '12px 0 0', color: '#8B8680', lineHeight: 1.45 }}>{tx.teachAnswers}</p>
        </section>
      </div>
    </ArcadeLayout>
  );
}

const kicker = {
  margin: 0,
  fontFamily: mono,
  fontSize: '0.68rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'rgba(20,17,12,0.48)',
};

const metalKicker = { ...kicker, color: '#8B8680' };

const note = {
  margin: '10px 0 0',
  color: 'rgba(20,17,12,0.72)',
  lineHeight: 1.5,
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

const table = {
  width: '100%',
  marginTop: 10,
  borderCollapse: 'collapse' as const,
  background: '#14161A',
  color: '#E8E4DC',
  fontFamily: mono,
  fontSize: '0.72rem',
};

const codeCell = {
  padding: '10px 12px',
  borderBottom: '1px solid #2A2E34',
  color: '#E8B86D',
  whiteSpace: 'nowrap' as const,
  verticalAlign: 'top' as const,
};

const meanCell = {
  padding: '10px 12px',
  borderBottom: '1px solid #2A2E34',
  lineHeight: 1.45,
};

const list = {
  margin: '10px 0 0',
  paddingLeft: '1.1rem',
  display: 'grid',
  gap: 8,
  lineHeight: 1.45,
};
