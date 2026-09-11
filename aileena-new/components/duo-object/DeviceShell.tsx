'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { DuoMode } from '../../lib/duoObject';

const spring = { type: 'spring' as const, stiffness: 78, damping: 16, mass: 1.15 };

const preserve = { transformStyle: 'preserve-3d' as const };

const device = {
  tent: { rotateX: 10, rotateY: -18, y: 12, scale: 1 },
  hold: { rotateX: 4, rotateY: -4, y: -70, scale: 0.92 },
  rest: { rotateX: 78, rotateY: 14, y: 64, scale: 0.88 },
};

const panelA = {
  tent: { rotateX: 4, rotateY: -12 },
  hold: { rotateX: 0, rotateY: 0 },
  rest: { rotateX: 0, rotateY: 0 },
};

const panelB = {
  tent: { rotateX: 56, rotateY: 10 },
  hold: { rotateX: 10, rotateY: 164 },
  rest: { rotateX: 6, rotateY: 8 },
};

type Props = {
  mode: DuoMode;
  childrenA: ReactNode;
  childrenB: ReactNode;
  onPickUp: () => void;
  onSetDown: () => void;
  onRest: () => void;
};

/** Two glass faces + hinge. Pose is physical, not a route change. */
export default function DeviceShell({
  mode,
  childrenA,
  childrenB,
  onPickUp,
  onSetDown,
  onRest,
}: Props) {
  return (
    <motion.div
      className="duo-device"
      data-device=""
      role="button"
      tabIndex={0}
      aria-label="duo object"
      style={preserve}
      animate={device[mode]}
      transition={spring}
      drag={mode === 'rest' ? false : 'y'}
      dragConstraints={{ top: -140, bottom: 48 }}
      dragElastic={0.14}
      onDragEnd={(_, info) => {
        if (info.offset.y < -32 || info.velocity.y < -220) onPickUp();
        else if (info.offset.y > 24 || info.velocity.y > 220) onSetDown();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onPickUp();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onRest();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPickUp();
        }
      }}
    >
      <motion.div
        className="duo-panel duo-panel-a"
        style={preserve}
        animate={panelA[mode]}
        transition={spring}
      >
        {childrenA}
      </motion.div>
      <div className="duo-spine" aria-hidden />
      <motion.div
        className="duo-panel duo-panel-b"
        style={preserve}
        animate={panelB[mode]}
        transition={spring}
      >
        {childrenB}
      </motion.div>
    </motion.div>
  );
}
