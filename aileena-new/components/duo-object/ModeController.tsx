'use client';

import { DUO_MODES, type DuoMode } from '../../lib/duoObject';

type Props = {
  mode: DuoMode;
  onMode: (mode: DuoMode) => void;
};

/** Quiet pose ticks. First paint is the object, not this row. */
export default function ModeController({ mode, onMode }: Props) {
  return (
    <div className="duo-cluster" data-modes="">
      {DUO_MODES.map((item) => (
        <button
          key={item.id}
          type="button"
          className="duo-k"
          data-on={item.id === mode}
          title={item.intent}
          onClick={() => onMode(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
