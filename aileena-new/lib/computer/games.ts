/** Pure game rules for the site computer. No React, no DOM. */

export type MineCell = { mine: boolean; adjacent: number; open: boolean; flag: boolean };
export type MineBoard = {
  rows: number;
  cols: number;
  mines: number;
  cells: MineCell[];
  status: 'ready' | 'playing' | 'won' | 'lost';
};

function neighbors(rows: number, cols: number, index: number): number[] {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) out.push(r * cols + c);
    }
  }
  return out;
}

export function newMineBoard(rows = 9, cols = 9, mines = 10): MineBoard {
  return {
    rows,
    cols,
    mines,
    status: 'ready',
    cells: Array.from({ length: rows * cols }, () => ({ mine: false, adjacent: 0, open: false, flag: false })),
  };
}

/** First reveal places mines away from the tapped cell and its neighbours. */
function plantMines(board: MineBoard, safeIndex: number, rand: () => number): MineCell[] {
  const { rows, cols, mines } = board;
  const keepClear = new Set([safeIndex, ...neighbors(rows, cols, safeIndex)]);
  let pool = board.cells.map((_, i) => i).filter((i) => !keepClear.has(i));
  if (pool.length < mines) pool = board.cells.map((_, i) => i).filter((i) => i !== safeIndex);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const mineSet = new Set(pool.slice(0, mines));
  return board.cells.map((cell, i) => ({
    ...cell,
    mine: mineSet.has(i),
    adjacent: neighbors(rows, cols, i).filter((n) => mineSet.has(n)).length,
  }));
}

export function revealMine(board: MineBoard, index: number, rand: () => number = Math.random): MineBoard {
  if (board.status === 'won' || board.status === 'lost') return board;
  const start = board.cells[index];
  if (!start || start.open || start.flag) return board;

  const cells = board.status === 'ready' ? plantMines(board, index, rand) : board.cells.map((c) => ({ ...c }));
  if (cells[index].mine) {
    return {
      ...board,
      status: 'lost',
      cells: cells.map((c) => (c.mine ? { ...c, open: true } : c)),
    };
  }

  const queue = [index];
  while (queue.length) {
    const i = queue.pop() as number;
    const cell = cells[i];
    if (cell.open || cell.flag) continue;
    cell.open = true;
    if (cell.adjacent === 0) {
      for (const n of neighbors(board.rows, board.cols, i)) {
        if (!cells[n].open && !cells[n].mine) queue.push(n);
      }
    }
  }

  const opened = cells.filter((c) => c.open).length;
  const won = opened === cells.length - board.mines;
  return {
    ...board,
    cells: won ? cells.map((c) => (c.mine ? { ...c, flag: true } : c)) : cells,
    status: won ? 'won' : 'playing',
  };
}

export function toggleMineFlag(board: MineBoard, index: number): MineBoard {
  if (board.status === 'won' || board.status === 'lost') return board;
  const cell = board.cells[index];
  if (!cell || cell.open) return board;
  const cells = board.cells.slice();
  cells[index] = { ...cell, flag: !cell.flag };
  return { ...board, cells };
}

export type SnakeDir = 'up' | 'down' | 'left' | 'right';
export type SnakeGame = {
  size: number;
  /** Cell indices, head first. */
  snake: number[];
  dir: SnakeDir;
  nextDir: SnakeDir;
  food: number;
  score: number;
  status: 'ready' | 'playing' | 'paused' | 'over';
};

const OPPOSITE: Record<SnakeDir, SnakeDir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

function placeFood(size: number, snake: number[], rand: () => number): number {
  const taken = new Set(snake);
  const free: number[] = [];
  for (let i = 0; i < size * size; i += 1) if (!taken.has(i)) free.push(i);
  return free.length ? free[Math.floor(rand() * free.length)] : -1;
}

export function newSnakeGame(size = 16, rand: () => number = Math.random): SnakeGame {
  const mid = Math.floor(size / 2);
  const head = mid * size + mid;
  const snake = [head, head - 1, head - 2];
  return { size, snake, dir: 'right', nextDir: 'right', food: placeFood(size, snake, rand), score: 0, status: 'ready' };
}

export function turnSnake(game: SnakeGame, dir: SnakeDir): SnakeGame {
  if (game.status === 'over' || dir === OPPOSITE[game.dir]) return game;
  return { ...game, nextDir: dir, status: game.status === 'ready' ? 'playing' : game.status };
}

export function stepSnake(game: SnakeGame, rand: () => number = Math.random): SnakeGame {
  if (game.status !== 'playing') return game;
  const { size } = game;
  const dir = game.nextDir;
  const head = game.snake[0];
  const x = head % size;
  const y = Math.floor(head / size);
  const nx = x + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0);
  const ny = y + (dir === 'down' ? 1 : dir === 'up' ? -1 : 0);
  if (nx < 0 || ny < 0 || nx >= size || ny >= size) return { ...game, dir, status: 'over' };

  const next = ny * size + nx;
  const eating = next === game.food;
  const body = eating ? game.snake : game.snake.slice(0, -1);
  if (body.includes(next)) return { ...game, dir, status: 'over' };

  const snake = [next, ...body];
  if (!eating) return { ...game, snake, dir };
  const food = placeFood(size, snake, rand);
  return { ...game, snake, dir, food, score: game.score + 1, status: food < 0 ? 'over' : 'playing' };
}
