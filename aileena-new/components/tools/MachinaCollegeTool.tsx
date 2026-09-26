'use client';

import { useState } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { collegeReply } from '../../lib/collegeCite';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';

export default function MachinaCollegeTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.machinaCollege;
  const tool = getToolBySlug('machina-college');
  const [line, setLine] = useState('');
  const [reply, setReply] = useState('');

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee}>
      <div style={{ display: 'grid', gap: 28, maxWidth: 720, margin: '0 auto' }}>
        <ArcadeCabinetFrame
          glyph={tool?.arcade.glyph ?? '¶'}
          screenGradient={tool?.arcade.screenGradient ?? '#e7efe8'}
        >
          <p style={{ margin: 0, fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(20,17,12,0.48)' }}>
            {tx.kicker}
          </p>
          <textarea
            value={line}
            onChange={(event) => setLine(event.target.value)}
            placeholder={tx.placeholder}
            rows={4}
            data-testid="college-line"
            style={{
              marginTop: 14,
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid rgba(20,17,12,0.16)',
              background: 'rgba(255,252,247,0.7)',
              padding: 12,
              fontSize: '0.95rem',
              lineHeight: 1.5,
              resize: 'vertical',
            }}
          />
          <button
            type="button"
            className="arcade-start-btn"
            data-testid="college-hear"
            style={{ marginTop: 14 }}
            onClick={() => setReply(collegeReply(line) || tx.miss)}
          >
            {tx.hear}
          </button>
          {reply ? (
            <p data-testid="college-reply" style={{ margin: '16px 0 0', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.55 }}>
              {reply}
            </p>
          ) : null}
        </ArcadeCabinetFrame>
        <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem', lineHeight: 1.55, color: 'rgba(20,17,12,0.45)' }}>
          {tx.disclaimer}
        </p>
      </div>
    </ArcadeLayout>
  );
}
