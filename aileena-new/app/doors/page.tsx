'use client';

import DoorsDirectory from '../../components/DoorsDirectory';

/**
 * Secondary entry — room directory.
 * Same door list as homepage #watch-hub; back chrome shows ← home.
 */
export default function DoorsPage() {
  return <DoorsDirectory minFullHeight={false} headingLevel="h1" />;
}
