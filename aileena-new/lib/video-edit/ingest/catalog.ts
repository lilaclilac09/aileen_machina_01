import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { projectPath, toRel } from '../domain/paths';
import type { Catalog, ProjectManifest } from '../domain/types';
import { CatalogSchema } from '../domain/schemas';
import { scanProjectMedia } from './scanner';

export function buildCatalog(root: string, project: ProjectManifest): Catalog {
  const { videos, photos, notes } = scanProjectMedia(root, project);
  const catalog: Catalog = {
    schemaVersion: 1,
    projectId: project.id,
    generatedAt: new Date().toISOString(),
    rootRel: '.',
    assets: [...videos, ...photos],
    notes,
  };
  return CatalogSchema.parse(catalog);
}

export function writeCatalog(root: string, project: ProjectManifest, catalog: Catalog): string {
  const out = projectPath(root, project.paths.catalog);
  mkdirSync(dirname(out), { recursive: true });
  // Store portable absPath cleared → rewrite abs as empty hint; keep relPath canonical
  const portable = {
    ...catalog,
    assets: catalog.assets.map((a) => ({
      ...a,
      absPath: a.relPath, // portable: abs rewritten to rel for JSON; runtime re-resolves
      relPath: a.relPath || toRel(root, a.absPath),
    })),
  };
  writeFileSync(out, JSON.stringify(portable, null, 2) + '\n');
  return out;
}

export function catalogSummary(catalog: Catalog): string {
  const videos = catalog.assets.filter((a) => a.kind === 'video').length;
  const photos = catalog.assets.filter((a) => a.kind === 'photo').length;
  const bad = catalog.assets.filter((a) => !a.probeOk).length;
  return `videos=${videos} photos=${photos} probe_fail=${bad}`;
}
