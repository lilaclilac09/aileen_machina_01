/**
 * Back-compat: render EDL → out/*.mp4
 * Prefer: pnpm video:render  or  pnpm exec tsx scripts/video-edit/cli.ts render
 */
import { runRender, runVerify } from '../../lib/video-edit';

async function main(): Promise<void> {
  const { outputPath } = await runRender({});
  await runVerify({}, outputPath);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
