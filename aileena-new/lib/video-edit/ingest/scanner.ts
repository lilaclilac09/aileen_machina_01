import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { toRel } from '../domain/paths';
import type { MediaAsset, ProjectManifest } from '../domain/types';
import { isSupportedMedia, probeAsset } from './probe';
import { tagsForPath } from '../planning/tags';

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const abs = join(dir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      out.push(...walkFiles(abs));
    } else if (st.isFile() && isSupportedMedia(name)) {
      out.push(abs);
    }
  }
  return out;
}

function withTags(asset: MediaAsset): MediaAsset {
  return {
    ...asset,
    tags: tagsForPath(asset.relPath, asset.filename),
  };
}

export function scanProjectMedia(
  root: string,
  project: ProjectManifest,
): { videos: MediaAsset[]; photos: MediaAsset[]; notes: string[] } {
  const notes: string[] = [];
  const takesDir = join(root, project.paths.takes);
  const photosDir = join(root, project.paths.photos);

  const takeFiles = walkFiles(takesDir);
  const photoFiles = walkFiles(photosDir);

  if (takeFiles.length === 0 && photoFiles.length === 0) {
    notes.push(
      `NO MEDIA YET — drop files into ${project.paths.takes}/ and ${project.paths.photos}/ ` +
        `(or: bash scripts/video-edit/stage-media.sh)`,
    );
  }

  const videos: MediaAsset[] = [];
  const photos: MediaAsset[] = [];

  for (const abs of takeFiles.sort()) {
    const asset = withTags(probeAsset(abs, toRel(root, abs)));
    if (asset.kind === 'photo') {
      photos.push(asset);
      notes.push(`Photo found under takes/: ${asset.filename} — treating as photo`);
    } else if (asset.kind === 'video') {
      if (!asset.probeOk || !asset.duration_s || asset.duration_s <= 0) {
        notes.push(`SKIP video (probe failed): ${asset.filename} — ${asset.probeError || 'no duration'}`);
        continue;
      }
      videos.push(asset);
      if (asset.tags?.includes('timelapse')) {
        notes.push(`TIMELAPSE detected: ${asset.relPath}`);
      }
      if (asset.tags?.includes('final')) {
        notes.push(`FINAL TIMELAPSE candidate: ${asset.relPath}`);
      }
    } else {
      notes.push(`SKIP unsupported under takes/: ${asset.filename}`);
    }
  }

  for (const abs of photoFiles.sort()) {
    const asset = withTags(probeAsset(abs, toRel(root, abs)));
    if (
      asset.kind === 'photo' ||
      (asset.width && asset.height && !asset.hasAudio && (asset.duration_s ?? 0) <= 1)
    ) {
      photos.push({ ...asset, kind: 'photo' });
      if (asset.tags?.includes('girls')) {
        notes.push(`GIRLS photo: ${asset.relPath}`);
      }
    } else if (asset.kind === 'video') {
      videos.push(asset);
      notes.push(`Video found under photos/: ${asset.filename} — treating as video`);
    } else {
      notes.push(`SKIP unsupported under photos/: ${asset.filename}`);
    }
  }

  const girlsCount = photos.filter((p) => p.tags?.includes('girls')).length;
  const tlCount = videos.filter((v) => v.tags?.includes('timelapse')).length;
  notes.push(`Priority summary: girls_photos=${girlsCount} timelapse_videos=${tlCount}`);

  return { videos, photos, notes };
}
