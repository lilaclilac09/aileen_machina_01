'use client';

import { useEffect, useRef, useState } from 'react';
import { Bomb, Flag, RotateCcw } from 'lucide-react';
import { newMineBoard, revealMine, toggleMineFlag, type MineBoard } from '../../lib/computer/games';
import { SaveBadge, useAppState } from './useAppState';

const NUMBER_COLORS = ['', '#008f86', '#3f7d2c', '#b4532a', '#5a3fa0', '#8a2a2a', '#00665f', '#1b1713', '#6b6b6b'];

export default function MinesweeperApp() {
  const { state, update, status } = useAppState('mines');
  const [board, setBoard] = useState<MineBoard>(() => newMineBoard());
  const [flagMode, setFlagMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    if (board.status !== 'playing') return;
    startedAt.current ??= Date.now();
    const id = window.setInterval(() => {
      if (startedAt.current) setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [board.status]);

  useEffect(() => {
    if ((board.status !== 'won' && board.status !== 'lost') || recorded.current) return;
    recorded.current = true;
    const took = Math.max(1, Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000));
    setSeconds(took);
    update((prev) =>
      board.status === 'won'
        ? { ...prev, wins: prev.wins + 1, bestSeconds: prev.bestSeconds ? Math.min(prev.bestSeconds, took) : took }
        : { ...prev, losses: prev.losses + 1 },
    );
  }, [board.status, update]);

  const reset = () => {
    setBoard(newMineBoard());
    setSeconds(0);
    startedAt.current = null;
    recorded.current = false;
  };

  const act = (index: number, flag: boolean) => {
    if (flag) {
      setBoard((b) => toggleMineFlag(b, index));
      return;
    }
    setBoard((b) => revealMine(b, index));
  };

  const flags = board.cells.filter((c) => c.flag).length;
  const face = board.status === 'won' ? 'cleared' : board.status === 'lost' ? 'boom' : `${board.mines - flags} left`;

  return (
    <div data-testid="computer-app-mines" className="space-y-2">
      <div className="flex items-center justify-between gap-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-[#007d75]">
        <span data-testid="mines-status" data-state={board.status}>
          {face} · {seconds}s
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={flagMode}
            onClick={() => setFlagMode((v) => !v)}
            data-testid="mines-flag-mode"
            className={`inline-flex min-h-9 items-center gap-1 rounded-[7px] border px-2 ${
              flagMode ? 'border-[#00a89d] bg-[#e7f6f3]' : 'border-[#d8cfc0] bg-white'
            }`}
          >
            <Flag size={13} aria-hidden /> flag
          </button>
          <button
            type="button"
            onClick={reset}
            data-testid="mines-reset"
            className="inline-flex min-h-9 items-center gap-1 rounded-[7px] border border-[#d8cfc0] bg-white px-2"
          >
            <RotateCcw size={13} aria-hidden /> new
          </button>
        </div>
      </div>

      <div
        role="grid"
        aria-label="Minesweeper board"
        className="mx-auto grid w-full max-w-[17rem] gap-[3px] rounded-[8px] bg-[#0b2422] p-[5px]"
        style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
      >
        {board.cells.map((cell, i) => (
          <button
            key={i}
            type="button"
            role="gridcell"
            data-testid={`mines-cell-${i}`}
            data-open={cell.open ? '1' : '0'}
            aria-label={cell.open ? (cell.mine ? 'mine' : `${cell.adjacent} nearby`) : cell.flag ? 'flagged' : 'hidden'}
            onClick={() => act(i, flagMode)}
            onContextMenu={(e) => {
              e.preventDefault();
              act(i, true);
            }}
            className={`flex aspect-square items-center justify-center rounded-[3px] font-mono text-[0.78rem] font-semibold ${
              cell.open ? (cell.mine ? 'bg-[#b4532a] text-white' : 'bg-[#f6f0e4]') : 'bg-[#1d4a46] text-[#8fe6dd] active:bg-[#256059]'
            }`}
            style={cell.open && !cell.mine ? { color: NUMBER_COLORS[cell.adjacent] } : undefined}
          >
            {cell.open ? (cell.mine ? <Bomb size={13} aria-hidden /> : cell.adjacent || '') : cell.flag ? <Flag size={12} aria-hidden /> : ''}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[#1b1713]/55">
        <span data-testid="mines-record">
          {state.wins}W · {state.losses}L · best {state.bestSeconds ? `${state.bestSeconds}s` : '—'}
        </span>
        <SaveBadge status={status} />
      </div>
      <p className="text-[0.62rem] text-[#1b1713]/45">Tap to open. Long-press or flag mode to mark a mine.</p>
    </div>
  );
}
