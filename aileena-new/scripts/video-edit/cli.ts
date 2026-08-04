/**
 * Cheap Cursor video-edit CLI
 *
 *   pnpm video:catalog
 *   pnpm video:plan
 *   pnpm video:render
 *   pnpm video:verify
 *   pnpm video:recap
 *   pnpm exec tsx scripts/video-edit/cli.ts recap --skip-whisper
 */
import {
  runCatalog,
  runPlan,
  runRecap,
  runRender,
  runVerify,
  resolveProjectRoot,
  loadProject,
} from '../../lib/video-edit';

async function main(): Promise<void> {
  const [, , cmd = 'recap', ...rest] = process.argv;
  const skipWhisper = rest.includes('--skip-whisper');
  const skipRender = rest.includes('--skip-render');
  const skipVerify = rest.includes('--skip-verify');

  const root = resolveProjectRoot();
  const project = loadProject(root);
  console.log(`project: ${project.id}`);
  console.log(`root:    ${root}`);

  switch (cmd) {
    case 'catalog':
    case 'inventory':
      await runCatalog({ skipWhisper });
      break;
    case 'plan':
      await runPlan({ skipWhisper });
      break;
    case 'render':
      await runRender({});
      break;
    case 'verify':
      await runVerify({});
      break;
    case 'recap':
      await runRecap({ skipWhisper, skipRender, skipVerify });
      break;
    case 'help':
    case '--help':
    case '-h':
      console.log(`Usage: tsx scripts/video-edit/cli.ts <catalog|plan|render|verify|recap> [--skip-whisper]`);
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
