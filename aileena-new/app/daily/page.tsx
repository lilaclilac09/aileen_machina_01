import type { Metadata } from 'next';
import DailyBoard from '../../components/DailyBoard';
import ScrollUnlock from '../blog/ScrollUnlock';
import { getOwnerIdentity } from '@/lib/owner-gate';
import { readPublicDailyBoard } from '@/lib/dailyBoardStore';

export const metadata: Metadata = {
  title: 'daily board · AILEENA',
  description: 'one or two lines a day.',
};

export const dynamic = 'force-dynamic';

export default async function DailyPage() {
  const identity = await getOwnerIdentity();
  const owner = Boolean(identity);
  const initial = await readPublicDailyBoard(owner);

  return (
    <>
      <ScrollUnlock />
      <DailyBoard initial={initial} />
    </>
  );
}
