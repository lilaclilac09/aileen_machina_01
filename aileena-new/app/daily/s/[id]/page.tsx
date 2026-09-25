import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DailyBoard from '../../../../components/DailyBoard';
import ScrollUnlock from '../../../blog/ScrollUnlock';
import { dailySharePath, noteIsPublished } from '@/lib/dailyBoard';
import { readPublicDailyBoard } from '@/lib/dailyBoardStore';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!dailySharePath(id)) return { title: 'two lines · AILEENA' };
  return { title: 'two lines · AILEENA', description: 'view only.' };
}

export default async function DailySharePage({ params }: Props) {
  const { id } = await params;
  if (!dailySharePath(id)) notFound();

  const initial = await readPublicDailyBoard(false);
  const note = initial.notes.find((n) => n.id === id);
  if (!note || !noteIsPublished(note)) notFound();

  return (
    <>
      <ScrollUnlock />
      <DailyBoard
        shareId={id}
        initial={{
          ...initial,
          notes: [note],
          comments: { [id]: initial.comments[id] ?? [] },
          owner: false,
        }}
      />
    </>
  );
}
