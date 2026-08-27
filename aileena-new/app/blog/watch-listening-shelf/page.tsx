import type { Metadata } from 'next';
import { getOwnerIdentity } from '@/lib/owner-gate';
import WatchShelf from './WatchShelf';

export const metadata: Metadata = {
  title: 'watch / listening shelf · AILEENA',
  description: 'things that tune the eye and ear',
};

export default async function WatchListeningShelfPage() {
  const owner = Boolean(await getOwnerIdentity());
  return <WatchShelf owner={owner} />;
}
