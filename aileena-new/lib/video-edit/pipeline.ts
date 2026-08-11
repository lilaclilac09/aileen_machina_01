import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  Catalog,
  FinalEdit,
  PipelineProgress,
  ProjectManifest,
  VerificationReport,
} from './domain/types';
import { parseCatalog, parseFinalEdit } from './domain/schemas';
import { loadProject, projectPath, resolveProjectRoot, toAbs } from './domain/paths';
import { buildCatalog, catalogSummary, writeCatalog } from './ingest/catalog';
import { planEdit } from './planning/heuristic-planner';
import { transcribeAssets } from './transcription/whisper-local';
import { concatSegments, renderEdit, writeConcatList } from './render/segment-renderer';
import { requireFfmpeg } from './render/ffmpeg-runner';
import { verifyRender, writeVerifyReport } from './verify/media-qc';

export type PipelineOptions = {
  root?: string;
  skipWhisper?: boolean;
  skipRender?: boolean;
  skipVerify?: boolean;
  onProgress?: (p: PipelineProgress) => void;
};

function emit(
  onProgress: PipelineOptions['onProgress'],
  phase: PipelineProgress['phase'],
  message: string,
  progress: number,
): void {
  onProgress?.({ phase, message, progress });
  console.log(`[${phase}] ${message}`);
}

export function getProject(root?: string): { root: string; project: ProjectManifest } {
  const r = root || resolveProjectRoot();
  return { root: r, project: loadProject(r) };
}

export async function runCatalog(opts: PipelineOptions = {}): Promise<Catalog> {
  const { root, project } = getProject(opts.root);
  emit(opts.onProgress, 'catalog', 'Scanning takes/ + photos/', 0.1);
  requireFfmpeg();
  const catalog = buildCatalog(root, project);
  // Re-resolve abs paths for runtime
  for (const a of catalog.assets) {
    a.absPath = toAbs(root, a.relPath);
  }
  const path = writeCatalog(root, project, catalog);
  emit(opts.onProgress, 'catalog', `Wrote ${path} (${catalogSummary(catalog)})`, 0.25);
  for (const n of catalog.notes) console.log(`  NOTE: ${n}`);
  return catalog;
}

export async function runPlan(opts: PipelineOptions = {}): Promise<FinalEdit> {
  const { root, project } = getProject(opts.root);
  const catalogPath = projectPath(root, project.paths.catalog);
  let catalog: Catalog;
  if (existsSync(catalogPath)) {
    catalog = parseCatalog(JSON.parse(readFileSync(catalogPath, 'utf8')));
    for (const a of catalog.assets) a.absPath = toAbs(root, a.relPath);
  } else {
    catalog = await runCatalog(opts);
  }

  let transcripts = new Map();
  if (!opts.skipWhisper && project.planner.whisper.enabled) {
    emit(opts.onProgress, 'transcribe', 'Optional local Whisper (skip if missing)', 0.35);
    transcripts = await transcribeAssets(root, project, catalog.assets);
    const skipped = [...transcripts.values()].filter((t) => t.optionalSkipped).length;
    const ok = [...transcripts.values()].filter((t) => !t.optionalSkipped && t.text).length;
    emit(
      opts.onProgress,
      'transcribe',
      `transcripts ok=${ok} skipped=${skipped}`,
      0.45,
    );
  }

  emit(opts.onProgress, 'plan', `Planning with ${project.planner.engine}`, 0.55);
  const edl = planEdit(root, project, catalog, { transcripts });
  const edlPath = projectPath(root, project.paths.edl);
  mkdirSync(join(edlPath, '..'), { recursive: true });
  writeFileSync(edlPath, JSON.stringify(edl, null, 2) + '\n');
  emit(opts.onProgress, 'plan', `Wrote ${edlPath}`, 0.65);

  for (const b of edl.beats) {
    const dur = b.clips.filter((c) => c.enabled).reduce((s, c) => s + c.duration_s, 0);
    const n = b.clips.filter((c) => c.enabled).length;
    console.log(`  Beat ${b.beat} ${b.title}: ${n} clips · ~${dur.toFixed(1)}s (target ${b.target_s}s)`);
  }
  return edl;
}

export async function runRender(opts: PipelineOptions = {}): Promise<{ edl: FinalEdit; outputPath: string }> {
  const { root, project } = getProject(opts.root);
  const edlPath = projectPath(root, project.paths.edl);
  if (!existsSync(edlPath)) {
    throw new Error(`Missing ${edlPath}. Run: pnpm video:plan`);
  }
  const edl = parseFinalEdit(JSON.parse(readFileSync(edlPath, 'utf8')));
  if (edl.notes.some((n) => n.includes('NO MEDIA'))) {
    throw new Error(edl.notes.filter((n) => n.includes('NO MEDIA')).join('\n'));
  }

  emit(opts.onProgress, 'render', 'Rendering segments (ffmpeg, audio preserved when present)', 0.7);
  requireFfmpeg();
  const { segments } = renderEdit(root, edl);
  const listPath = join(root, project.paths.work, 'concat.txt');
  writeConcatList(listPath, segments);
  const outputPath = projectPath(root, join(project.paths.out, edl.output.filename));
  concatSegments(listPath, outputPath, edl.output);
  emit(opts.onProgress, 'render', `Done → ${outputPath}`, 0.85);
  return { edl, outputPath };
}

export async function runVerify(
  opts: PipelineOptions = {},
  outputPath?: string,
): Promise<VerificationReport> {
  const { root, project } = getProject(opts.root);
  const edlPath = projectPath(root, project.paths.edl);
  const edl = parseFinalEdit(JSON.parse(readFileSync(edlPath, 'utf8')));
  const out =
    outputPath ||
    projectPath(root, join(project.paths.out, project.output.filename));
  emit(opts.onProgress, 'verify', 'QC probe', 0.9);
  const report = verifyRender(root, edl, existsSync(out) ? out : null);
  const reportPath = projectPath(root, project.paths.verifyReport);
  writeVerifyReport(reportPath, report);
  emit(
    opts.onProgress,
    'verify',
    `Wrote ${reportPath} · ok=${report.ok}`,
    0.95,
  );
  for (const c of report.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.id}: ${c.detail}`);
  }
  return report;
}

/** Full cheap-Cursor loop: catalog → (whisper?) → plan → render → verify */
export async function runRecap(opts: PipelineOptions = {}): Promise<{
  catalog: Catalog;
  edl: FinalEdit;
  outputPath: string | null;
  report: VerificationReport | null;
}> {
  const catalog = await runCatalog(opts);
  const edl = await runPlan({ ...opts });
  if (opts.skipRender) {
    emit(opts.onProgress, 'done', 'Plan only', 1);
    return { catalog, edl, outputPath: null, report: null };
  }
  if (edl.notes.some((n) => n.includes('NO MEDIA'))) {
    emit(opts.onProgress, 'error', 'No media — stop before render', 1);
    return { catalog, edl, outputPath: null, report: null };
  }
  const { outputPath } = await runRender(opts);
  const report = opts.skipVerify ? null : await runVerify(opts, outputPath);
  emit(opts.onProgress, 'done', 'Recap complete', 1);
  return { catalog, edl, outputPath, report };
}

export * from './domain/types';
export { parseFinalEdit, parseCatalog } from './domain/schemas';
export { resolveProjectRoot, loadProject } from './domain/paths';
