/**
 * Cheap Cursor video-edit engine
 * catalog → optional whisper → plan/EDL → ffmpeg → verify
 */
export * from './pipeline';
export * from './domain/types';
export { parseFinalEdit, parseCatalog, FinalEditSchema, CatalogSchema } from './domain/schemas';
export { resolveProjectRoot, loadProject, toAbs, toRel } from './domain/paths';
