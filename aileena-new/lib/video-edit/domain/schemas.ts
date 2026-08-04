import { z } from 'zod';

export const ClipKindSchema = z.enum(['logo', 'photo', 'video', 'title', 'silence_pad']);

export const TakeCandidateSchema = z.object({
  assetId: z.string(),
  start_s: z.number().finite().nonnegative(),
  end_s: z.number().finite().positive(),
  score: z.number().finite(),
  reasons: z.array(z.string()),
  transcriptSnippet: z.string().optional(),
});

export const EdlClipSchema = z
  .object({
    id: z.string().min(1),
    kind: ClipKindSchema,
    source: z.string().min(1),
    assetId: z.string().optional(),
    start_s: z.number().finite().nonnegative(),
    end_s: z.number().finite().nonnegative(),
    duration_s: z.number().finite().positive(),
    label: z.string(),
    rationale: z.string(),
    beatId: z.string().min(1),
    enabled: z.boolean().default(true),
    audio: z
      .object({
        keep: z.boolean(),
        gainDb: z.number().finite(),
      })
      .optional(),
    transcriptAnchor: z
      .object({
        firstWords: z.string().optional(),
        lastWords: z.string().optional(),
      })
      .optional(),
    candidates: z.array(TakeCandidateSchema).optional(),
  })
  .superRefine((clip, ctx) => {
    if (clip.end_s < clip.start_s) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `end_s (${clip.end_s}) < start_s (${clip.start_s}) for ${clip.id}`,
      });
    }
    const span = clip.end_s - clip.start_s;
    if (Math.abs(span - clip.duration_s) > 0.05 && clip.kind === 'video') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duration_s (${clip.duration_s}) != end-start (${span}) for ${clip.id}`,
      });
    }
  });

export const EdlBeatSchema = z.object({
  beat: z.number().int().positive(),
  id: z.string().min(1),
  title: z.string().min(1),
  role: z.string().min(1),
  target_s: z.number().finite().positive(),
  max_s: z.number().finite().positive(),
  clips: z.array(EdlClipSchema),
});

export const OutputSpecSchema = z.object({
  filename: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().positive(),
  videoCodec: z.string(),
  audioCodec: z.string(),
  audioBitrate: z.string(),
  crf: z.number().int().min(0).max(51),
  preset: z.string(),
  padColor: z.string(),
  keepAudio: z.boolean(),
  audioFadeIn_s: z.number().finite().nonnegative(),
  audioFadeOut_s: z.number().finite().nonnegative(),
});

export const FinalEditSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: z.string().min(1),
  event: z.string().min(1),
  generatedAt: z.string().min(1),
  plannerEngine: z.string().min(1),
  script: z.string(),
  brief: z.string().nullable(),
  logo: z.string().nullable(),
  catalogPath: z.string(),
  output: OutputSpecSchema,
  audio: z.object({
    keepAudio: z.boolean(),
    fadeIn_s: z.number().finite().nonnegative(),
    fadeOut_s: z.number().finite().nonnegative(),
    codec: z.string(),
    bitrate: z.string(),
  }),
  beats: z.array(EdlBeatSchema).min(1),
  notes: z.array(z.string()),
  publicCopyRules: z.array(z.string()),
  provenance: z.object({
    cwd: z.string(),
    node: z.string(),
    argv: z.array(z.string()),
  }),
});

export const MediaAssetSchema = z.object({
  id: z.string(),
  kind: z.enum(['video', 'photo', 'audio', 'unknown']),
  relPath: z.string(),
  absPath: z.string(),
  filename: z.string(),
  ext: z.string(),
  bytes: z.number().nonnegative(),
  sha256: z.string().optional(),
  duration_s: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  fps: z.number().nullable(),
  rotation: z.number().nullable(),
  orientation: z.enum(['landscape', 'portrait', 'square', 'unknown']),
  hasVideo: z.boolean(),
  hasAudio: z.boolean(),
  videoCodec: z.string().nullable(),
  audioCodec: z.string().nullable(),
  probeOk: z.boolean(),
  probeError: z.string().optional(),
});

export const CatalogSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: z.string(),
  generatedAt: z.string(),
  rootRel: z.string(),
  assets: z.array(MediaAssetSchema),
  notes: z.array(z.string()),
});

export const VerificationReportSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: z.string(),
  generatedAt: z.string(),
  ok: z.boolean(),
  edlPath: z.string(),
  outputPath: z.string().nullable(),
  expectedDuration_s: z.number(),
  actualDuration_s: z.number().nullable(),
  hasVideo: z.boolean().nullable(),
  hasAudio: z.boolean().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  checks: z.array(
    z.object({
      id: z.string(),
      ok: z.boolean(),
      detail: z.string(),
    }),
  ),
  notes: z.array(z.string()),
});

export function parseFinalEdit(data: unknown) {
  return FinalEditSchema.parse(data);
}

export function parseCatalog(data: unknown) {
  return CatalogSchema.parse(data);
}
