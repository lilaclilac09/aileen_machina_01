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
import {
  isFinalTimelapse,
  isGirls,
  isTimelapse,
  pickTimelapseWindow,
  type MediaTag,
} from './tags';

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

function assetTags(asset: MediaAsset): MediaTag[] {
  return (asset.tags || []) as MediaTag[];
}

function scoreVideoCandidate(
  asset: MediaAsset,
  preferLandscape: boolean,
  planner: ProjectManifest['planner'],
  transcript?: Transcript,
): TakeCandidate {
  const reasons: string[] = [];
  let score = 50;
  const dur = asset.duration_s || 0;
  const tags = assetTags(asset);

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

  if (isTimelapse(tags)) {
    score += planner.timelapseScoreBonus ?? 40;
    reasons.push('timelapse');
  }
  if (isFinalTimelapse(tags)) {
    score += 30;
    reasons.push('final-timelapse');
  }
  if (isGirls(tags)) {
    score += planner.girlsPhotoBonus ?? 25;
    reasons.push('girls-tagged');
  }

  if (transcript && !transcript.optionalSkipped && transcript.text.trim()) {
    const words = transcript.words.length || transcript.text.split(/\s+/).length;
    score += Math.min(15, words / 4);
    reasons.push(`transcript words≈${words}`);
  }

  const win = isTimelapse(tags)
    ? pickTimelapseWindow(dur, {
        min_s: planner.timelapseMin_s ?? 8,
        max_s: planner.timelapseMax_s ?? 14,
        preferEnd: true,
      })
    : pickVideoWindow(dur, planner);

  return {
    assetId: asset.id,
    start_s: win.start,
    end_s: win.end,
    score,
    reasons,
    transcriptSnippet: transcript?.text?.slice(0, 120),
  };
}

function photoSortKey(asset: MediaAsset, preferGirls: boolean): number {
  const tags = assetTags(asset);
  let key = 0;
  if (preferGirls && isGirls(tags)) key -= 100;
  if (asset.orientation === 'landscape') key -= 10;
  else if (asset.orientation === 'square') key -= 5;
  return key;
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
  const preferGirls = project.planner.preferGirlsPhotos !== false;

  const cardsDir = join(root, project.paths.work, 'cards');
  const titlePath = join(cardsDir, 'title.svg');
  const outroPath = join(cardsDir, 'outro.svg');
  writeTitleCard(titlePath, project);
  writeOutroCard(outroPath, project);

  const logoRel = join(project.paths.brand, project.brand.logoFile);
  const logoAbs = join(root, logoRel);
  const logo = existsSync(logoAbs) ? logoRel.replace(/\\/g, '/') : null;

  const videoPool = [...videos]
    .map((v) => ({
      asset: v,
      cand: scoreVideoCandidate(v, true, project.planner, opts.transcripts?.get(v.id)),
    }))
    .sort((a, b) => b.cand.score - a.cand.score);

  const photoPool = [...photos].sort((a, b) => {
    const ka = photoSortKey(a, preferGirls);
    const kb = photoSortKey(b, preferGirls);
    return ka - kb || a.filename.localeCompare(b.filename);
  });

  const usedVideo = new Set<string>();
  const usedPhoto = new Set<string>();

  function takePhotos(
    n: number,
    beat: ProjectManifest['beats'][number],
    girlsOnly = false,
  ): EdlClip[] {
    const out: EdlClip[] = [];
    for (const asset of photoPool) {
      if (out.length >= n) break;
      if (usedPhoto.has(asset.id)) continue;
      if (girlsOnly && !isGirls(assetTags(asset))) continue;
      usedPhoto.add(asset.id);
      const dur = project.planner.photoDuration_s;
      const girls = isGirls(assetTags(asset));
      out.push({
        id: `photo-${asset.filename}`,
        kind: 'photo',
        source: asset.relPath,
        assetId: asset.id,
        start_s: 0,
        end_s: dur,
        duration_s: dur,
        label: asset.filename,
        rationale: `${beat.id}: Ken-Burns${girls ? ' · GIRLS priority' : ''} (${asset.orientation})`,
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
      const sa = scoreVideoCandidate(
        a.asset,
        preferLandscape,
        project.planner,
        opts.transcripts?.get(a.asset.id),
      ).score;
      const sb = scoreVideoCandidate(
        b.asset,
        preferLandscape,
        project.planner,
        opts.transcripts?.get(b.asset.id),
      ).score;
      return sb - sa;
    });

    for (const { asset } of ranked) {
      if (out.length >= n) break;
      if (usedVideo.has(asset.id)) continue;
      // Reserve final timelapse for forced beat — don't spend it early
      if (isFinalTimelapse(assetTags(asset)) || (isTimelapse(assetTags(asset)) && project.planner.forceFinalTimelapse)) {
        continue;
      }
      usedVideo.add(asset.id);

      const primary = scoreVideoCandidate(
        asset,
        preferLandscape,
        project.planner,
        opts.transcripts?.get(asset.id),
      );
      const dur = asset.duration_s || 0;
      const alts: TakeCandidate[] = [primary];
      if (dur > 12) {
        const earlyEnd = Math.min(
          dur,
          project.planner.skipLead_s + primary.end_s - primary.start_s,
        );
        alts.push({
          assetId: asset.id,
          start_s: project.planner.skipLead_s,
          end_s: earlyEnd,
          score: primary.score - 8,
          reasons: ['alt: early window'],
        });
      }

      out.push({
        id: `video-${asset.filename}`,
        kind: 'video',
        source: asset.relPath,
        assetId: asset.id,
        start_s: primary.start_s,
        end_s: primary.end_s,
        duration_s: primary.end_s - primary.start_s,
        label: asset.filename,
        rationale: `${beat.id}: score=${primary.score.toFixed(0)} · ${primary.reasons.join(', ')} · ${primary.start_s.toFixed(1)}–${primary.end_s.toFixed(1)}s`,
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
  const contentDefs = project.beats.filter((b) => !b.card && b.id !== 'timelapse');

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

  const filled = new Map<string, { photos: number; videos: number }>();
  for (const d of contentDefs) filled.set(d.id, { photos: 0, videos: 0 });

  const maxPhotoQ = Math.max(0, ...contentDefs.map((d) => d.photoQuota));
  const maxVideoQ = Math.max(0, ...contentDefs.map((d) => d.videoQuota));

  // Reserve girls photos into community (and vibe) BEFORE other beats eat them
  if (preferGirls) {
    const reserveOrder = contentDefs.filter((d) => d.id === 'community' || d.id === 'vibe');
    for (const def of reserveOrder) {
      const counts = filled.get(def.id)!;
      const beat = beats.find((b) => b.id === def.id)!;
      while (counts.photos < def.photoQuota) {
        const added = takePhotos(1, def, true);
        if (!added.length) break;
        beat.clips.push(...added);
        counts.photos += 1;
      }
    }
  }

  // Remaining photo quotas (any photo)
  for (let round = 0; round < maxPhotoQ; round += 1) {
    for (const def of contentDefs) {
      const counts = filled.get(def.id)!;
      if (counts.photos >= def.photoQuota) continue;
      const beat = beats.find((b) => b.id === def.id)!;
      const added = takePhotos(1, def, false);
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

  // Force final timelapse beat (before outro)
  const tlBeat = beats.find((b) => b.id === 'timelapse');
  if (tlBeat && project.planner.forceFinalTimelapse !== false) {
    const candidates = videos
      .filter((v) => !usedVideo.has(v.id))
      .map((v) => ({
        asset: v,
        tags: assetTags(v),
        cand: scoreVideoCandidate(v, true, project.planner, opts.transcripts?.get(v.id)),
      }))
      .filter((x) => isTimelapse(x.tags) || isFinalTimelapse(x.tags))
      .sort((a, b) => {
        const af = isFinalTimelapse(a.tags) ? 0 : 1;
        const bf = isFinalTimelapse(b.tags) ? 0 : 1;
        return af - bf || b.cand.score - a.cand.score;
      });

    // Also consider already-tagged in folder even if used? Prefer unused.
    let pick = candidates[0];
    if (!pick) {
      // Fallback: longest video as pseudo-timelapse if named 最后*
      const finals = videos
        .filter((v) => !usedVideo.has(v.id))
        .filter((v) => /最后|最終|final/i.test(v.filename + v.relPath))
        .sort((a, b) => (b.duration_s || 0) - (a.duration_s || 0));
      if (finals[0]) {
        pick = {
          asset: finals[0],
          tags: assetTags(finals[0]),
          cand: scoreVideoCandidate(finals[0], true, project.planner),
        };
      }
    }

    if (pick) {
      usedVideo.add(pick.asset.id);
      const win = pickTimelapseWindow(pick.asset.duration_s || 0, {
        min_s: project.planner.timelapseMin_s ?? 8,
        max_s: project.planner.timelapseMax_s ?? 14,
        preferEnd: true,
      });
      tlBeat.clips.push({
        id: `timelapse-${pick.asset.filename}`,
        kind: 'video',
        source: pick.asset.relPath,
        assetId: pick.asset.id,
        start_s: win.start,
        end_s: win.end,
        duration_s: win.end - win.start,
        label: pick.asset.filename,
        rationale: `FORCE final timelapse · tags=${pick.tags.join(',') || 'final-fallback'} · end-window ${win.start.toFixed(1)}–${win.end.toFixed(1)}s`,
        beatId: 'timelapse',
        enabled: true,
        audio: { keep: false, gainDb: 0 }, // timelapse usually music-free / noisy
        candidates: [pick.cand],
      });
      notes.push(`Forced timelapse into beat: ${pick.asset.relPath}`);
    } else {
      notes.push(
        'WARNING: No timelapse found. Put the final 延时 file in takes/timelapse/ ' +
          '(or name it *延时* / *最后延时*) and re-run plan.',
      );
    }
  }

  // Community leftovers — prefer remaining girls photos first
  const community = beats.find((b) => b.id === 'community');
  const communityDef = project.beats.find((b) => b.id === 'community');
  if (community && communityDef?.absorbLeftovers) {
    let extra = 0;
    const budget = communityDef.leftoverMaxExtra_s ?? 18;
    const leftoverPhotos = [
      ...photoPool.filter((p) => !usedPhoto.has(p.id) && isGirls(assetTags(p))),
      ...photoPool.filter((p) => !usedPhoto.has(p.id) && !isGirls(assetTags(p))),
    ];
    for (const asset of leftoverPhotos) {
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
        rationale: `community leftover${isGirls(assetTags(asset)) ? ' · GIRLS' : ''}`,
        beatId: 'community',
        enabled: true,
        audio: { keep: false, gainDb: 0 },
      });
      extra += dur;
    }
  }

  const unusedV = videos.filter((v) => !usedVideo.has(v.id)).length;
  const unusedP = photos.filter((p) => !usedPhoto.has(p.id)).length;
  if (unusedV || unusedP) {
    notes.push(`Unused after budget: videos=${unusedV} photos=${unusedP}`);
  }

  const girlsUsed = photos.filter((p) => usedPhoto.has(p.id) && isGirls(assetTags(p))).length;
  notes.push(`Girls photos used: ${girlsUsed}`);

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
