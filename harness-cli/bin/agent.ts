#!/usr/bin/env node
/**
 * Cursor-shaped agent CLI — thin adapter over hx Harness.
 * Run: node --experimental-strip-types bin/agent.ts -p "list files" --mode ask
 */
import { runCursorCli } from '../src/adapters/cursorCli.ts';

runCursorCli(process.argv.slice(2)).catch((err) => {
  console.error(`[agent] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
