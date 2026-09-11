'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { DuoMode } from '../../lib/duoObject';

const spring = { type: 'spring' as const, stiffness: 78, damping: 16, mass: 1.15 };

const device = {
  tent: { rotateX: 8, rotateY: 0, y: 8, scale: 1 },
  hold: { rotateX: 2, rotateY: -8, y: -64, scale: 0.84 },
  rest: { rotateX: 76, rotateY: 18, y: 56, scale: 0.9 },
};

const panelA = {
  tent: { rotateY: -34 },
  hold: { rotateY: -9 },
  rest: { rotateY: -3 },
};

const panelB = {
  tent: { rotateY: 34 },
  hold: { rotateY: 9 },
  rest: { rotateY: 3 },
};

type Props = {
  mode: DuoMode;
  childrenA: ReactNode;
  childrenB: ReactNode;
  onPickUp: () => void;
  onRest: () => void;
};

/** Two glass faces + hinge. Pose is physical, not a route change. */
export default function DeviceShell({ mode, childrenA, childrenB, onPickUp, onRest }: Props) {
  return (
    <motion.div
      className="duo-device"
      data-device=""
      role="button"
      tabIndex={0}
      aria-label="duo object"
      animate={device[mode]}
      transition={spring}
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
      <motion.div className="duo-panel duo-panel-a" animate={panelA[mode]} transition={spring}>
        {childrenA}
      </motion.div>
      <div className="duo-spine" aria-hidden />
      <motion.div className="duo-panel duo-panel-b" animate={panelB[mode]} transition={spring}>
        {childrenB}
      </motion.div>
    </motion.div>
  );
}
