'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, RotateCcw } from 'lucide-react';
import { newSnakeGame, stepSnake, turnSnake, type SnakeDir, type SnakeGame } from '../../lib/computer/games';
import { SaveBadge, useAppState } from './useAppState';

const KEYS: Record<string, SnakeDir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

const PAD: { dir: SnakeDir; label: string; Icon: typeof ChevronUp; area: string }[] = [
  { dir: 'up', label: 'Up', Icon: ChevronUp, area: '1 / 2' },
  { dir: 'left', label: 'Left', Icon: ChevronLeft, area: '2 / 1' },
  { dir: 'right', label: 'Right', Icon: ChevronRight, area: '2 / 3' },
  { dir: 'down', label: 'Down', Icon: ChevronDown, area: '3 / 2' },
];

export default function SnakeApp() {
  const { state, update, status } = useAppState('snake');
  const [game, setGame] = useState<SnakeGame>(() => newSnakeGame());
  const boardRef = useRef<HTMLDivElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    if (game.status !== 'playing') return;
    const speed = Math.max(80, 150 - game.score * 4);
    const id = window.setInterval(() => setGame((g) => stepSnake(g)), speed);
    return () => window.clearInterval(id);
  }, [game.status, game.score]);

  useEffect(() => {
    if (game.status !== 'over' || recorded.current) return;
    recorded.current = true;
    update((prev) => ({ best: Math.max(prev.best, game.score), games: prev.games + 1 }));
  }, [game.status, game.score, update]);

  const turn = (dir: SnakeDir) => setGame((g) => turnSnake(g, dir));

  const restart = () => {
    recorded.current = false;
    setGame(newSnakeGame());
    boardRef.current?.focus();
  };

  const pause = () => setGame((g) => (g.status === 'playing' ? { ...g, status: 'paused' } : g.status === 'paused' ? { ...g, status: 'playing' } : g));

  const cells = new Set(game.snake);
  const head = game.snake[0];
  const label =
    game.status === 'ready' ? 'press an arrow' : game.status === 'paused' ? 'paused' : game.status === 'over' ? 'game over' : 'go';

  return (
    <div data-testid="computer-app-snake" className="space-y-1.5">
      <div className="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.12em] text-[#007d75]">
        <span data-testid="snake-status" data-state={game.status}>
          {label} · score <span data-testid="snake-score">{game.score}</span>
        </span>
        <button
          type="button"
          onClick={restart}
          data-testid="snake-reset"
          className="inline-flex min-h-9 items-center gap-1 rounded-[7px] border border-[#d8cfc0] bg-white px-2"
        >
          <RotateCcw size={13} aria-hidden /> new
        </button>
      </div>

      <div
        ref={boardRef}
        tabIndex={0}
        role="application"
        aria-label="Snake board. Use arrow keys or swipe."
        data-testid="snake-board"
        onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault();
            pause();
            return;
          }
          const dir = KEYS[e.key];
          if (!dir) return;
          e.preventDefault();
          turn(dir);
        }}
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
          turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
        }}
        className="mx-auto grid w-full max-w-[11rem] touch-none gap-px rounded-[8px] bg-[#0b2422] p-1 outline-none focus-visible:ring-2 focus-visible:ring-[#00a89d]"
        style={{ gridTemplateColumns: `repeat(${game.size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: game.size * game.size }, (_, i) => (
          <span
            key={i}
            className={`aspect-square rounded-[2px] ${
              i === head ? 'bg-[#e8fffb]' : cells.has(i) ? 'bg-[#4fd1c5]' : i === game.food ? 'bg-[#f2a65a]' : 'bg-[#123532]'
            }`}
          />
        ))}
      </div>

      <div className="mx-auto grid w-[7rem] grid-cols-3 grid-rows-3 gap-1" aria-label="Snake controls">
        {PAD.map(({ dir, label: name, Icon, area }) => (
          <button
            key={dir}
            type="button"
            aria-label={name}
            data-testid={`snake-${dir}`}
            onClick={() => turn(dir)}
            className="flex min-h-10 items-center justify-center rounded-[8px] border border-[#d8cfc0] border-b-2 border-b-[#c2b7a3] bg-white text-[#007d75] active:translate-y-[1px]"
            style={{ gridArea: area }}
          >
            <Icon size={18} aria-hidden />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[#1b1713]/55">
        <span data-testid="snake-record">
          best {state.best} · {state.games} games
        </span>
        <SaveBadge status={status} />
      </div>
    </div>
  );
}
