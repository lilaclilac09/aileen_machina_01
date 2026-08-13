'use client';

import ScrollUnlock from '../blog/ScrollUnlock';
import ArchiveNav, { type ArchiveRoom } from './ArchiveNav';
import './archive.css';

export default function ArchivePage({
  room,
  title,
  dek,
  date,
  children,
}: {
  room: ArchiveRoom;
  title: string;
  dek: string;
  date?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="arc-page">
      <ScrollUnlock />
      <ArchiveNav current={room} />
      <main className="arc-wrap">
        <header className="arc-hero">
          {date ? <p className="arc-date">{date}</p> : null}
          <h1 className="arc-title">{title}</h1>
          <p className="arc-dek">{dek}</p>
        </header>
        {children}
      </main>
    </div>
  );
}
