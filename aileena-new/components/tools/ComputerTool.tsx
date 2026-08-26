'use client';

import Link from 'next/link';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';
import OpenAgentChatButton from '../OpenAgentChatButton';

export default function ComputerTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.computer;
  const tool = getToolBySlug('computer');

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee}>
      <div style={{ display: 'grid', gap: 28, maxWidth: 720, margin: '0 auto' }}>
        <ArcadeCabinetFrame
          glyph={tool?.arcade.glyph ?? '⌘'}
          screenGradient={tool?.arcade.screenGradient ?? '#dceee9'}
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
            {tx.sameDialog}
          </p>
          <p style={{ margin: '12px 0 0', fontSize: '0.95rem', lineHeight: 1.55, color: 'rgba(20,17,12,0.72)' }}>
            {tx.howto}
          </p>
          <div style={{ marginTop: 18 }}>
            <OpenAgentChatButton label={tx.openConsole} testId="tools-computer-open-console" />
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
          {tx.disclaimer}{' '}
          <Link href="/blog/machina-computer" style={{ color: '#008f86' }}>
            {tx.essay}
          </Link>
        </p>
      </div>
    </ArcadeLayout>
  );
}
