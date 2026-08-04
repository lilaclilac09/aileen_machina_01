/**
 * Back-compat: catalog + plan → work/final-edit.json
 * Prefer: pnpm video:plan  or  pnpm exec tsx scripts/video-edit/cli.ts plan
 */
import { runPlan } from '../../lib/video-edit';

runPlan({ skipWhisper: process.argv.includes('--skip-whisper') }).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
