'use client';

import { useDuoLayout } from '../lib/duoPose';

/**
 * Mounts fold listeners (visualViewport + viewport-segments + posture)
 * and writes data-duo-* / --duo-crease on <html>. Renders nothing.
 */
export default function DuoDocumentSync() {
  useDuoLayout();
  return null;
}
