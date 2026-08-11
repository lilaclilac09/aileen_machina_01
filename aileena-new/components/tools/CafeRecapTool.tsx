'use client';

import { useCallback, useState, type CSSProperties } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';

const FLOW_STEPS = [
  'drop',
  'stage',
  'catalog',
  'plan',
  'render',
  'verify',
  'watch',
] as const;

const CLI_COMMAND = `cd aileena-new
pnpm install
bash scripts/video-edit/stage-media.sh          # preview sort
bash scripts/video-edit/stage-media.sh --go     # copy into takes/photos
pnpm video:recap                                # catalog → plan → ffmpeg → verify
open scripts/video-edit/out/cafe-cursor-shanghai-recap.mp4`;

const codeBox: CSSProperties = {
  width: '100%',
  margin: 0,
  padding: '14px 16px',
  borderRadius: 0,
  border: 'none',
  background: '#14110c',
  color: '#e8efe8',
  fontFamily: mono,
  fontSize: '0.72rem',
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
  overflowX: 'auto',
};

export default function CafeRecapTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.cafeRecap;
  const tool = getToolBySlug('cafe-recap');
  const [copied, setCopied] = useState(false);

  const copyCli = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CLI_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, []);

  return (
    <ArcadeLayout
      tag={tx.tag}
      title={tx.heading}
      subtitle={tx.body}
      backLabel={tx.backToTools}
      marquee={tx.marquee}
    >
      <div style={{ display: 'grid', gap: 28, maxWidth: 720, margin: '0 auto' }}>
        <ArcadeCabinetFrame
          glyph={tool?.arcade.glyph ?? '▣'}
          screenGradient={tool?.arcade.screenGradient ?? '#e8efe8'}
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
            {tx.flowTitle}
          </p>
          <ol
            style={{
              margin: '14px 0 0',
              padding: '0 0 0 1.1rem',
              display: 'grid',
              gap: 8,
            }}
          >
            {FLOW_STEPS.map((key) => (
              <li
                key={key}
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.4,
                  color: '#14110c',
                }}
              >
                {tx.steps[key]}
              </li>
            ))}
          </ol>
        </ArcadeCabinetFrame>

        <section style={{ display: 'grid', gap: 12 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: mono,
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(20,17,12,0.48)',
            }}
          >
            {tx.localOnlyTitle}
          </h2>
          <p style={{ margin: 0, color: 'rgba(20,17,12,0.72)', lineHeight: 1.55 }}>
            {tx.localOnlyBody}
          </p>
          <ul
            style={{
              margin: 0,
              padding: '0 0 0 1.1rem',
              color: 'rgba(20,17,12,0.72)',
              lineHeight: 1.55,
            }}
          >
            <li>{tx.ruleTimelapse}</li>
            <li>{tx.rulePhotos}</li>
            <li>{tx.ruleGrade}</li>
          </ul>
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: mono,
                fontSize: '0.72rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(20,17,12,0.48)',
              }}
            >
              {tx.cliTitle}
            </h2>
            <button type="button" className="arcade-start-btn" onClick={() => void copyCli()}>
              {copied ? tx.copied : tx.copyCli}
            </button>
          </div>
          <pre style={codeBox}>{CLI_COMMAND}</pre>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(20,17,12,0.55)' }}>
            {tx.cliHint}
          </p>
        </section>

        <section style={{ display: 'grid', gap: 10 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: mono,
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(20,17,12,0.48)',
            }}
          >
            {tx.docsTitle}
          </h2>
          <p style={{ margin: 0, color: 'rgba(20,17,12,0.72)', lineHeight: 1.55 }}>
            {tx.docsBody}
          </p>
          <p style={{ margin: 0, fontFamily: mono, fontSize: '0.78rem', lineHeight: 1.6 }}>
            <code>aileena-new/docs/FIRST_CUT.md</code>
            <br />
            <code>aileena-new/scripts/video-edit/README.md</code>
            <br />
            <code>aileena-new/scripts/video-edit/edit-room.html</code>
          </p>
        </section>
      </div>
    </ArcadeLayout>
  );
}
