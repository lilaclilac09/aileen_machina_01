'use client';

import { useEffect, useRef, useState } from 'react';
import { BOOTH, clockLabel } from '../../lib/tools/photoautomatData';
import { mountBoothStage, type BoothStageHandle, type BoothStageState } from '../../lib/tools/photoautomatStage';

export type StageLabels = {
  hint: string;
  curtain: string;
  sit: string;
  xray: string;
  spin: string;
  download: string;
  save: string;
  again: string;
  inspect: string;
  flash: string;
  flashValue: string;
  baths: string;
  bathNames: readonly string[];
  clock: string;
  seat: string;
  seatValue: string;
};

const IDLE: BoothStageState = { curtain: false, spin: false, xray: false, bath: -1, clock: 0, strip: 'none' };

export default function PhotoautomatStage({
  hidden,
  labels,
  speed,
  onReady,
  onUnsupported,
  onEntered,
  onSave,
  onAgain,
}: {
  hidden: boolean;
  labels: StageLabels;
  /** How many times faster than the real booth the shot clock runs here. */
  speed: number;
  onReady: (stage: BoothStageHandle | null) => void;
  onUnsupported: () => void;
  onEntered: () => void;
  onSave: () => void;
  onAgain: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<BoothStageHandle | null>(null);
  const callbacks = useRef({ onReady, onUnsupported, onEntered });
  const [state, setState] = useState<BoothStageState>(IDLE);

  useEffect(() => {
    callbacks.current = { onReady, onUnsupported, onEntered };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let stage: BoothStageHandle;
    try {
      stage = mountBoothStage(host, {
        onState: setState,
        onEntered: () => callbacks.current.onEntered(),
      });
    } catch {
      // No WebGL: there is no street to stand on, so the booth opens straight onto the cabin.
      callbacks.current.onUnsupported();
      return undefined;
    }
    stageRef.current = stage;
    callbacks.current.onReady(stage);
    return () => {
      stageRef.current = null;
      callbacks.current.onReady(null);
      stage.dispose();
    };
  }, []);

  const developing = state.bath >= 0;
  const seatCm = Math.round(((BOOTH.lensDistanceM[0] + BOOTH.lensDistanceM[1]) / 2) * 100);

  return (
    <div
      className="foto-stage"
      data-testid="foto-stage"
      data-curtain={state.curtain ? 'open' : 'closed'}
      data-spin={state.spin ? 'yes' : 'no'}
      data-xray={state.xray ? 'yes' : 'no'}
      data-bath={developing ? BOOTH.baths[state.bath] : 'none'}
      data-strip={state.strip}
      hidden={hidden}
    >
      <div className="foto-gl" ref={hostRef} />
      <dl className="foto-readout" data-testid="foto-readout">
        <dt>{labels.flash}</dt>
        <dd>
          {labels.flashValue.replace('{first}', String(BOOTH.firstFlashS)).replace('{gap}', String(BOOTH.flashGapS)).replace('{speed}', String(speed))}
        </dd>
        <dt>{labels.seat}</dt>
        <dd>{labels.seatValue.replace('{cm}', String(seatCm))}</dd>
        <dt>{labels.baths}</dt>
        <dd>
          {labels.bathNames.map((name, index) => (
            <span key={name} className={state.bath === index ? 'is-now' : undefined}>
              {index ? ' → ' : ''}
              {name}
            </span>
          ))}
        </dd>
        <dt>{labels.clock}</dt>
        <dd className={developing ? 'is-now' : undefined} data-testid="foto-clock">
          {clockLabel(state.strip === 'none' ? state.clock : BOOTH.developS)} / {clockLabel(BOOTH.developS)}
        </dd>
      </dl>
      {developing || state.strip === 'slot' ? null : (
        <p className="foto-hint">{state.strip === 'held' ? labels.inspect : labels.hint}</p>
      )}
      <div className="foto-stage-actions">
        {state.strip === 'slot' ? (
          <button type="button" data-testid="foto-take" onClick={() => stageRef.current?.takeStrip()}>
            {labels.download}
          </button>
        ) : state.strip === 'held' ? (
          <>
            <button type="button" data-testid="foto-download" onClick={onSave}>
              {labels.save}
            </button>
            <button type="button" data-testid="foto-again" onClick={onAgain}>
              {labels.again}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              data-testid="foto-curtain"
              aria-pressed={state.curtain}
              disabled={developing}
              onClick={() => stageRef.current?.toggleCurtain()}
            >
              {labels.curtain}
            </button>
            <button type="button" data-testid="foto-enter" disabled={developing} onClick={() => stageRef.current?.enter()}>
              {labels.sit}
            </button>
            <button
              type="button"
              data-testid="foto-xray"
              aria-pressed={state.xray}
              disabled={developing}
              onClick={() => stageRef.current?.toggleXray()}
            >
              {labels.xray}
            </button>
            <button
              type="button"
              data-testid="foto-spin"
              aria-pressed={state.spin}
              disabled={developing}
              onClick={() => stageRef.current?.toggleSpin()}
            >
              {labels.spin}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
