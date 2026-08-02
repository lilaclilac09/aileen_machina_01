export const APP_NAME = "Gather";
export const APP_NAME_ZH = "共影";

/** Soft capacity target (~PicTomo Standard / user request) */
export const MAX_PHOTOS_PER_ALBUM = 500;
export const ALBUM_TTL_DAYS = 30;

/** Largest original a browser will attempt to downscale */
export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 20;
/**
 * Vercel Functions reject request bodies over 4.5 MB, so the browser
 * downscales each photo and uploads it in its own request.
 */
export const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
export const UPLOAD_BUDGET_BYTES = 3 * 1024 * 1024;
export const MAX_COMMENT_LENGTH = 280;
export const MAX_TITLE_LENGTH = 80;
export const MAX_NICKNAME_LENGTH = 32;
/** Soft rate limit: max comments per visitor per photo per window */
export const COMMENT_RATE_LIMIT = 8;
export const COMMENT_RATE_WINDOW_MS = 10 * 60 * 1000;

export const THUMB_MAX_EDGE = 1200;
export const FULL_MAX_EDGE = 2400;

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export const ADMIN_COOKIE_PREFIX = "gather_admin_";
export const VISITOR_COOKIE = "gather_vid";
