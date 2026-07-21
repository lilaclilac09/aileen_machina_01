export const APP_NAME = "Gather";
export const APP_NAME_ZH = "共影";

/** Soft capacity target (~PicTomo Standard / user request) */
export const MAX_PHOTOS_PER_ALBUM = 500;
export const ALBUM_TTL_DAYS = 30;

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 20;
export const MAX_COMMENT_LENGTH = 280;
export const MAX_TITLE_LENGTH = 80;
export const MAX_NICKNAME_LENGTH = 32;

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
