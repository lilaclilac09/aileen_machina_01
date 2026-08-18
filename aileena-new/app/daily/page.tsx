import type { Metadata } from 'next';
import DailyBoard from '../../components/DailyBoard';
import ScrollUnlock from '../blog/ScrollUnlock';

export const metadata: Metadata = {
  title: 'daily board · AILEENA',
  description: 'one or two lines a day.',
};

export default function DailyPage() {
  return (
    <>
      <ScrollUnlock />
      <DailyBoard />
    </>
  );
}
