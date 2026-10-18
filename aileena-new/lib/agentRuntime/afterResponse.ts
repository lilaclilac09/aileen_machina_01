import { after } from 'next/server';

type Schedule = (task: () => Promise<unknown>) => void;

/**
 * Keeps the function alive until post-stream writes (turn commit, quota
 * charge, ledger, perf) finish. Registered once while still in the request
 * scope; `track()` adds writes, `release()` says no more are coming. The
 * after() task waits for release (capped), then for every tracked write.
 * Outside a Next request scope (offline tests) after() throws; the writes
 * still run, they are just not lifetime-extended.
 */
export function postResponseWork(opts: { capMs?: number; schedule?: Schedule } = {}) {
  const pending = new Set<Promise<unknown>>();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const capMs = opts.capMs ?? 10_000;
  let scheduled = false;
  try {
    (opts.schedule ?? after)(async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([gate, new Promise<void>((r) => (timer = setTimeout(r, capMs)))]);
      clearTimeout(timer);
      while (pending.size) await Promise.allSettled([...pending]);
    });
    scheduled = true;
  } catch {
    // Not in a request scope.
  }
  return {
    scheduled,
    track<T>(p: Promise<T>): Promise<T> {
      const q: Promise<unknown> = p.then(
        () => pending.delete(q),
        () => pending.delete(q),
      );
      pending.add(q);
      return p;
    },
    release: () => release(),
  };
}
