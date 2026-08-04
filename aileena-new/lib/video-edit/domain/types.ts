/**
 * Cheap Cursor edit — domain types (runtime-validated via Zod in schemas.ts).
 * Thariq loop: catalog → (optional whisper) → plan/EDL → ffmpeg → verify → edit-room.
 */
export type ClipKind = 'logo' | 'photo' | 'video' | 'title' | 'silence_pad';

export type Orientation = 'landscape' | 'portrait' | 'square' | 'unknown';

export type MediaKind = 'video' | 'photo' | 'audio' | 'unknown';

export type AudioPolicy = {
  keepAudio: boolean;
  fadeIn_s: number;
  fadeOut_s: number;
  codec: string;
  bitrate: string;
};

export type OutputSpec = {
  filename: string;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  audioBitrate: string;
  crf: number;
  preset: string;
  padColor: string;
  keepAudio: boolean;
  audioFadeIn_s: number;
  audioFadeOut_s: number;
  /** Color grade — fix muddy yellow / lift dark phone footage */
  grade?: {
    /** brightness offset for eq filter, e.g. 0.06 */
    brightness: number;
    /** contrast, 1.0 = neutral */
    contrast: number;
    /** saturation, 1.0 = neutral */
    saturation: number;
    /** gamma, 1.0 = neutral; >1 lifts mids */
    gamma: number;
    /** colorbalance rs/gs/bs shadows (−1..1); negative rs = less yellow/red */
    shadowsRed: number;
    shadowsGreen: number;
    shadowsBlue: number;
    midtonesRed: number;
    midtonesGreen: number;
    midtonesBlue: number;
    highlightsRed: number;
    highlightsGreen: number;
    highlightsBlue: number;
  };
};

export type ProjectBeatDef = {
  id: string;
  index: number;
  title: string;
  role: string;
  target_s: number;
  max_s: number;
  photoQuota: number;
  videoQuota: number;
  preferLandscape?: boolean;
  softCopyOnly?: boolean;
  absorbLeftovers?: boolean;
  leftoverMaxExtra_s?: number;
  card?: 'title' | 'outro' | 'logo';
};

export type ProjectManifest = {
  id: string;
  schemaVersion: number;
  title: string;
  subtitle: string;
  date: string;
  hashtag: string;
  url: string;
  mediaDropFolder: string;
  paths: {
    takes: string;
    photos: string;
    brand: string;
    work: string;
    out: string;
    script: string;
    brief: string;
    edl: string;
    catalog: string;
    verifyReport: string;
  };
  output: OutputSpec;
  brand: {
    accent: string;
    bg: string;
    fg: string;
    logoFile: string;
  };
  beats: ProjectBeatDef[];
  planner: {
    photoDuration_s: number;
    videoWindowMin_s: number;
    videoWindowMax_s: number;
    videoWindowFrac: number;
    skipLead_s: number;
    skipTail_s: number;
    engine: string;
    whisper: {
      enabled: boolean;
      optional: boolean;
      model: string;
      language: string;
    };
    /** Force-include final timelapse before outro */
    forceFinalTimelapse?: boolean;
    timelapseMin_s?: number;
    timelapseMax_s?: number;
    /** Prefer girls-tagged photos in community / vibe */
    preferGirlsPhotos?: boolean;
    girlsPhotoBonus?: number;
    timelapseScoreBonus?: number;
  };
  publicCopyRules: string[];
};

export type MediaAsset = {
  id: string;
  kind: MediaKind;
  /** Project-relative path (portable across machines). */
  relPath: string;
  /** Absolute path resolved at runtime. */
  absPath: string;
  filename: string;
  ext: string;
  bytes: number;
  sha256?: string;
  duration_s: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  rotation: number | null;
  orientation: Orientation;
  hasVideo: boolean;
  hasAudio: boolean;
  videoCodec: string | null;
  audioCodec: string | null;
  probeOk: boolean;
  probeError?: string;
  /** Heuristic tags from path/filename: timelapse, girls, final, priority */
  tags?: string[];
};

export type Catalog = {
  schemaVersion: 1;
  projectId: string;
  generatedAt: string;
  rootRel: string;
  assets: MediaAsset[];
  notes: string[];
};

export type TranscriptWord = {
  word: string;
  start_s: number;
  end_s: number;
};

export type Transcript = {
  assetId: string;
  engine: string;
  language: string | null;
  text: string;
  words: TranscriptWord[];
  generatedAt: string;
  optionalSkipped?: boolean;
  skipReason?: string;
};

export type TakeCandidate = {
  assetId: string;
  start_s: number;
  end_s: number;
  score: number;
  reasons: string[];
  transcriptSnippet?: string;
};

export type EdlClip = {
  id: string;
  kind: ClipKind;
  /** Project-relative source path. */
  source: string;
  assetId?: string;
  start_s: number;
  end_s: number;
  duration_s: number;
  label: string;
  rationale: string;
  beatId: string;
  enabled: boolean;
  audio?: {
    keep: boolean;
    gainDb: number;
  };
  transcriptAnchor?: {
    firstWords?: string;
    lastWords?: string;
  };
  candidates?: TakeCandidate[];
};

export type EdlBeat = {
  beat: number;
  id: string;
  title: string;
  role: string;
  target_s: number;
  max_s: number;
  clips: EdlClip[];
};

export type FinalEdit = {
  schemaVersion: 1;
  projectId: string;
  event: string;
  generatedAt: string;
  plannerEngine: string;
  script: string;
  brief: string | null;
  logo: string | null;
  catalogPath: string;
  output: OutputSpec;
  audio: AudioPolicy;
  beats: EdlBeat[];
  notes: string[];
  publicCopyRules: string[];
  provenance: {
    cwd: string;
    node: string;
    argv: string[];
  };
};

export type VerificationReport = {
  schemaVersion: 1;
  projectId: string;
  generatedAt: string;
  ok: boolean;
  edlPath: string;
  outputPath: string | null;
  expectedDuration_s: number;
  actualDuration_s: number | null;
  hasVideo: boolean | null;
  hasAudio: boolean | null;
  width: number | null;
  height: number | null;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
  notes: string[];
};

export type PipelinePhase =
  | 'catalog'
  | 'transcribe'
  | 'plan'
  | 'render'
  | 'verify'
  | 'done'
  | 'error';

export type PipelineProgress = {
  phase: PipelinePhase;
  message: string;
  progress: number;
};
