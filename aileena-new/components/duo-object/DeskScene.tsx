'use client';

import type { ReactNode } from 'react';
import LightBleed from './LightBleed';

type Props = {
  children: ReactNode;
  onDesk: () => void;
};

/** Bedroom desk + cold window. Click empty wood to set the object down. */
export default function DeskScene({ children, onDesk }: Props) {
  return (
    <div className="duo-stage">
      <button type="button" className="duo-desk-hit" aria-label="set down" onClick={onDesk} />
      <div className="duo-desk" />
      <div className="duo-world">
        <LightBleed />
        {children}
      </div>
    </div>
  );
}
