import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
  Catalog,
  EdlBeat,
  EdlClip,
  FinalEdit,
  MediaAsset,
  ProjectManifest,
  TakeCandidate,
  Transcript,
} from '../domain/types';
import { FinalEditSchema } from '../domain/schemas';
import { writeOutroCard, writeTitleCard } from './cards';

function pickVideoWindow(
  duration: number,
  planner: ProjectManifest['planner'],
): { start: number; end: number } {
  const { videoWindowMin_s, videoWindowMax_s, videoWindowFrac, skipLead_s, skipTail_s } = planner;
  if (duration <= 0) return { start: 0, end: videoWindowMin_s };
  if (duration <= videoWindowMin_s + skipLead_s + skipTail_s) {
    return { start: 0, end: duration };
  }
  const win = Math.min(videoWindowMax_s, Math.max(videoWindowMin_s, duration * videoWindowFrac));
  const start = Math.max(skipLead_s, (duration - win) / 2);
  const end = Math.min(duration - skipTail_s, start + win);
  return { start, end: Math.max(start + 0.5, end) };
}

function scoreVideoCandidate(
  asset: MediaAsset,
  preferLandscape: boolean,
  transcript?: Transcript,
): TakeCandidate {
  const reasons: string[] = [];
  let score = 50;
  const dur = asset.duration_s || 0;

  if (asset.orientation === 'landscape') {
    score += preferLandscape ? 20 : 8;
    reasons.push('landscape');
  } else if (asset.orientation === 'portrait') {
    score += preferLandscape ? -8 : 5;
    reasons.push('portrait');
  }

  if (dur >= 8 && dur <= 90) {
    score += 12;
    reasons.push('useful duration');
  } else if (dur > 90) {
    score += 4;
    reasons.push('long take — mid window');
  } else if (dur > 0 && dur < 4) {
    score -= 10;
    reasons.push('very short');
  }

  if (asset.hasAudio) {
    score += 10;
    reasons.push('has audio');
  } else {
    score -= 5;
    reasons.push('silent');
  }

  if (transcript && !transcript.optionalSkipped && transcript.text.trim()) {
    const words = transcript.words.length || transcript.text.split(/\s+/).length;
    score += Math.min(15, words / 4);
    reasons.push(`transcript words≈${words}`);
  }

  const win = pickVideoWindow(dur, {
    photoDuration_s: 3.2,
    videoWindowMin_s: 4,
    videoWindowMax_s: 7,
    videoWindowFrac: 0.22,
    skipLead_s: 0.4,
    skipTail_s: 0.2,
    engine: 'heuristic_v2',
    whisper: { enabled: false, optional: true, model: 'base', language: 'auto' },
  });

  return {
    assetId: asset.id,
    start_s: win.start,
    end_s: win.end,
    score,
    reasons,
    transcriptSnippet: transcript?.text?.slice(0, 120),
  };
}

function beatDuration(clips: EdlClip[]): number {
  return clips.filter((c) => c.enabled).reduce((s, c) => s + c.duration_s, 0);
}

export type PlanOptions = {
  transcripts?: Map<string, Transcript>;
};

export function planEdit(
  root: string,
  project: ProjectManifest,
  catalog: Catalog,
  opts: PlanOptions = {},
): FinalEdit {
  const notes = [...catalog.notes];
  const videos = catalog.assets.filter((a) => a.kind === 'video' && a.probeOk);
  const photos = catalog.assets.filter((a) => a.kind === 'photo');

  const cardsDir = join(root, project.paths.work, 'cards');
  const titlePath = join(cardsDir, 'title.svg');
  const outroPath = join(cardsDir, 'outro.svg');
  writeTitleCard(titlePath, project);
  writeOutroCard(outroPath, project);

  const logoRel = join(project.paths.brand, project.brand.logoFile);
  const logoAbs = join(root, logoRel);
  const logo = existsSync(logoAbs) ? logoRel.replace(/\\/g, '/') : null;

  // Ranked pools
  const videoPool = [...videos]
    .map((v) => {
      const cand = scoreVideoCandidate(
        v,
        true,
        opts.transcripts?.get(v.id),
      );
      return { asset: v, cand };
    })
    .sort((a, b) => b.cand.score - a.cand.score);

  const photoPool = [...photos].sort((a, b) => {
    // Prefer landscape stills first
    const oa = a.orientation === 'landscape' ? 0 : a.orientation === 'square' ? 1 : 2;
    const ob = b.orientation === 'landscape' ? 0 : b.orientation === 'square' ? 1 : 2;
    return oa - ob || a.filename.localeCompare(b.filename);
  });

  const usedVideo = new Set<string>();
  const usedPhoto = new Set<string>();

  function takePhotos(n: number, beat: ProjectManifest['beats'][number]): EdlClip[] {
    const out: EdlClip[] = [];
    for (const asset of photoPool) {
      if (out.length >= n) break;
      if (usedPhoto.has(asset.id)) continue;
      usedPhoto.add(asset.id);
      const dur = project.planner.photoDuration_s;
      out.push({
        id: `photo-${asset.filename}`,
        kind: 'photo',
        source: asset.relPath,
        assetId: asset.id,
        start_s: 0,
        end_s: dur,
        duration_s: dur,
        label: asset.filename,
        rationale: `${beat.id}: Ken-Burns still (${asset.orientation})`,
        beatId: beat.id,
        enabled: true,
        audio: { keep: false, gainDb: 0 },
      });
    }
    return out;
  }

  function takeVideos(n: number, beat: ProjectManifest['beats'][number]): EdlClip[] {
    const out: EdlClip[] = [];
    const preferLandscape = Boolean(beat.preferLandscape);
    const ranked = [...videoPool].sort((a, b) => {
      const sa = scoreVideoCandidate(a.asset, preferLandscape, opts.transcripts?.get(a.asset.id)).score;
      const sb = scoreVideoCandidate(b.asset, preferLandscape, opts.transcripts?.get(b.asset.id)).score;
      return sb - sa;
    });

    for (const { asset } of ranked) {
      if (out.length >= n) break;
      if (usedVideo.has(asset.id)) continue;
      usedVideo.add(asset.id);

      const primary = scoreVideoCandidate(
        asset,
        preferLandscape,
        opts.transcripts?.get(asset.id),
      );
      // Keep a couple of alternate windows as candidates (early / late)
      const dur = asset.duration_s || 0;
      const alts: TakeCandidate[] = [primary];
      if (dur > 12) {
        const earlyEnd = Math.min(dur, project.planner.skipLead_s + primary.end_s - primary.start_s);
        alts.push({
          assetId: asset.id,
          start_s: project.planner.skipLead_s,
          end_s: earlyEnd,
          score: primary.score - 8,
          reasons: ['alt: early window'],
        });
      }

      const start = primary.start_s;
      const end = primary.end_s;
      out.push({
        id: `video-${asset.filename}`,
        kind: 'video',
        source: asset.relPath,
        assetId: asset.id,
        start_s: start,
        end_s: end,
        duration_s: end - start,
        label: asset.filename,
        rationale: `${beat.id}: score=${primary.score.toFixed(0)} · ${primary.reasons.join(', ')} · ${start.toFixed(1)}–${end.toFixed(1)}s`,
        beatId: beat.id,
        enabled: true,
        audio: { keep: project.output.keepAudio && asset.hasAudio, gainDb: 0 },
        transcriptAnchor: primary.transcriptSnippet
          ? { firstWords: primary.transcriptSnippet.slice(0, 40) }
          : undefined,
        candidates: alts,
      });
    }
    return out;
  }

  const beats: EdlBeat[] = [];
  const contentDefs = project.beats.filter((b) => !b.card);

  // Pass 1: brand cards + empty content beat shells
  for (const def of project.beats) {
    const clips: EdlClip[] = [];
    if (def.card === 'title') {
      clips.push({
        id: 'title-card',
        kind: 'title',
        source: `${project.paths.work}/cards/title.svg`.replace(/\\/g, '/'),
        start_s: 0,
        end_s: def.target_s,
        duration_s: def.target_s,
        label: 'title.svg',
        rationale: 'Brand-first open',
        beatId: def.id,
        enabled: true,
        audio: { keep: false, gainDb: 0 },
      });
    } else if (def.card === 'outro') {
      clips.push({
        id: 'outro-card',
        kind: 'title',
        source: `${project.paths.work}/cards/outro.svg`.replace(/\\/g, '/'),
        start_s: 0,
        end_s: def.target_s,
        duration_s: def.target_s,
        label: 'outro.svg',
        rationale: `Brand-last + ${project.hashtag}`,
        beatId: def.id,
        enabled: true,
        audio: { keep: false, gainDb: 0 },
      });
    }
    beats.push({
      beat: def.index,
      id: def.id,
      title: def.title,
      role: def.role,
      target_s: def.target_s,
      max_s: def.max_s,
      clips,
    });
  }

  // Pass 2: fill one slot at a time across beats (photos pass, then videos, then remaining quotas)
  const filled = new Map<string, { photos: number; videos: number }>();
  for (const d of contentDefs) filled.set(d.id, { photos: 0, videos: 0 });

  const maxPhotoQ = Math.max(0, ...contentDefs.map((d) => d.photoQuota));
  const maxVideoQ = Math.max(0, ...contentDefs.map((d) => d.videoQuota));

  for (let round = 0; round < maxPhotoQ; round += 1) {
    for (const def of contentDefs) {
      const counts = filled.get(def.id)!;
      if (counts.photos >= def.photoQuota) continue;
      const beat = beats.find((b) => b.id === def.id)!;
      const added = takePhotos(1, def);
      if (!added.length) continue;
      beat.clips.push(...added);
      counts.photos += 1;
    }
  }
  for (let round = 0; round < maxVideoQ; round += 1) {
    const order = [...contentDefs].sort((a, b) => {
      const ca = filled.get(a.id)!.videos;
      const cb = filled.get(b.id)!.videos;
      return ca - cb || a.index - b.index;
    });
    for (const def of order) {
      const counts = filled.get(def.id)!;
      if (counts.videos >= def.videoQuota) continue;
      const beat = beats.find((b) => b.id === def.id)!;
      const added = takeVideos(1, def);
      if (!added.length) continue;
      beat.clips.push(...added);
      counts.videos += 1;
    }
  }

  for (const def of contentDefs) {
    const beat = beats.find((b) => b.id === def.id)!;
    while (beatDuration(beat.clips) > def.max_s && beat.clips.length > 1) {
      const lastPhoto = [...beat.clips].reverse().find((c) => c.kind === 'photo' && c.enabled);
      if (lastPhoto) {
        lastPhoto.enabled = false;
        lastPhoto.rationale += ' · disabled (over max_s)';
        continue;
      }
      break;
    }
  }

  // Absorb leftovers into community beat with budget
  const community = beats.find((b) => b.id === 'community');
  const communityDef = project.beats.find((b) => b.id === 'community');
  if (community && communityDef?.absorbLeftovers) {
    let extra = 0;
    const budget = communityDef.leftoverMaxExtra_s ?? 12;
    for (const asset of photoPool) {
      if (usedPhoto.has(asset.id)) continue;
      if (extra + project.planner.photoDuration_s > budget) break;
      usedPhoto.add(asset.id);
      const dur = project.planner.photoDuration_s;
      community.clips.push({
        id: `photo-extra-${asset.filename}`,
        kind: 'photo',
        source: asset.relPath,
        assetId: asset.id,
        start_s: 0,
        end_s: dur,
        duration_s: dur,
        label: asset.filename,
        rationale: 'community leftover (budgeted)',
        beatId: 'community',
        enabled: true,
        audio: { keep: false, gainDb: 0 },
      });
      extra += dur;
    }
    for (const { asset, cand } of videoPool) {
      if (usedVideo.has(asset.id)) continue;
      const dur = cand.end_s - cand.start_s;
      if (extra + dur > budget) break;
      usedVideo.add(asset.id);
      community.clips.push({
        id: `video-extra-${asset.filename}`,
        kind: 'video',
        source: asset.relPath,
        assetId: asset.id,
        start_s: cand.start_s,
        end_s: cand.end_s,
        duration_s: dur,
        label: asset.filename,
        rationale: `community leftover score=${cand.score.toFixed(0)}`,
        beatId: 'community',
        enabled: true,
        audio: { keep: project.output.keepAudio && asset.hasAudio, gainDb: 0 },
        candidates: [cand],
      });
      extra += dur;
    }
  }

  const unusedV = videos.filter((v) => !usedVideo.has(v.id)).length;
  const unusedP = photos.filter((p) => !usedPhoto.has(p.id)).length;
  if (unusedV || unusedP) {
    notes.push(`Unused after budget: videos=${unusedV} photos=${unusedP}`);
  }

  const edl: FinalEdit = {
    schemaVersion: 1,
    projectId: project.id,
    event: `${project.title} ${project.date.replace(/-/g, '')}`,
    generatedAt: new Date().toISOString(),
    plannerEngine: project.planner.engine,
    script: project.paths.script,
    brief: project.paths.brief,
    logo,
    catalogPath: project.paths.catalog,
    output: project.output,
    audio: {
      keepAudio: project.output.keepAudio,
      fadeIn_s: project.output.audioFadeIn_s,
      fadeOut_s: project.output.audioFadeOut_s,
      codec: project.output.audioCodec,
      bitrate: project.output.audioBitrate,
    },
    beats,
    notes,
    publicCopyRules: project.publicCopyRules,
    provenance: {
      cwd: process.cwd(),
      node: process.version,
      argv: process.argv.slice(0, 4),
    },
  };

  return FinalEditSchema.parse(edl);
}
