'use client';

import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';
import OpenAgentChatButton from '../OpenAgentChatButton';

export default function ComputersTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.computers;
  const tool = getToolBySlug('computers');

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee}>
      <div style={{ display: 'grid', gap: 28, maxWidth: 720, margin: '0 auto' }}>
        <ArcadeCabinetFrame
          glyph={tool?.arcade.glyph ?? '⌨'}
          screenGradient={tool?.arcade.screenGradient ?? '#e7efe8'}
        >
          <p
            style={{
              margin: 0,
              fontFamily: mono,
              fontSize: '0.68rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(20,17,12,0.48)',
            }}
          >
            {tx.kicker}
          </p>
          <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 14 }}>
            <li>
              <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em' }}>{tx.cfName}</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.95rem', lineHeight: 1.5, color: 'rgba(20,17,12,0.72)' }}>
                {tx.cfBody}
              </p>
            </li>
            <li>
              <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em' }}>{tx.rwName}</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.95rem', lineHeight: 1.5, color: 'rgba(20,17,12,0.72)' }}>
                {tx.rwBody}
              </p>
              <p style={{ margin: '8px 0 0', fontFamily: mono, fontSize: '0.78rem', color: '#008f86' }}>{tx.rwSsh}</p>
            </li>
          </ul>
          <p style={{ margin: '16px 0 0', fontSize: '0.95rem', lineHeight: 1.55, color: 'rgba(20,17,12,0.72)' }}>
            {tx.howto}
          </p>
          <div style={{ marginTop: 18 }}>
            <OpenAgentChatButton label={tx.openConsole} testId="tools-computers-open-console" />
          </div>
        </ArcadeCabinetFrame>
        <p
          style={{
            margin: 0,
            fontFamily: mono,
            fontSize: '0.72rem',
            lineHeight: 1.55,
            color: 'rgba(20,17,12,0.45)',
          }}
        >
          {tx.disclaimer}
        </p>
      </div>
    </ArcadeLayout>
  );
}
