import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, normalize, relative, resolve } from 'node:path';
import type { ProjectManifest } from './types';

/** Resolve the video-edit project root (scripts/video-edit). */
export function resolveProjectRoot(cwd = process.cwd()): string {
  const candidates = [
    join(cwd, 'scripts/video-edit'),
    join(cwd, 'aileena-new/scripts/video-edit'),
    cwd.endsWith('video-edit') ? cwd : '',
    join(cwd, 'video-edit'),
  ].filter(Boolean);

  for (const c of candidates) {
    if (existsSync(join(c, 'project.json'))) return resolve(c);
  }

  throw new Error(
    `Cannot find video-edit project.json. Run from aileena-new/ (cwd=${cwd}).`,
  );
}

export function loadProject(root = resolveProjectRoot()): ProjectManifest {
  const raw = JSON.parse(readFileSync(join(root, 'project.json'), 'utf8')) as ProjectManifest;
  if (!raw?.id || !raw?.beats?.length) {
    throw new Error(`Invalid project.json at ${root}`);
  }
  return raw;
}

export function projectPath(root: string, rel: string): string {
  return resolve(root, rel);
}

export function toRel(root: string, abs: string): string {
  const rel = relative(root, abs);
  return rel.split('\\').join('/');
}

export function toAbs(root: string, maybeRel: string): string {
  if (isAbsolute(maybeRel)) return normalize(maybeRel);
  return resolve(root, maybeRel);
}

export function workDir(root: string, project: ProjectManifest): string {
  return projectPath(root, project.paths.work);
}
