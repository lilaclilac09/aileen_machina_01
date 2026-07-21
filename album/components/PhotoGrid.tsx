"use client";

import type { PhotoItem } from "./AlbumClient";

type Props = {
  photos: PhotoItem[];
  selectMode: boolean;
  selected: Set<string>;
  isAdmin: boolean;
  onOpen: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onPin: (id: string) => void;
};

export function PhotoGrid({
  photos,
  selectMode,
  selected,
  isAdmin,
  onOpen,
  onToggleSelect,
  onPin,
}: Props) {
  if (photos.length === 0) return null;

  return (
    <div className="mx-auto columns-2 gap-3 px-3 py-6 sm:columns-3 sm:gap-4 sm:px-6 md:columns-4 lg:max-w-6xl">
      {photos.map((photo, i) => {
        const selectedNow = selected.has(photo.id);
        return (
          <figure
            key={photo.id}
            className={`animate-rise group relative mb-3 break-inside-avoid overflow-hidden rounded-sm bg-mist/40 sm:mb-4 ${
              photo.pinned ? "animate-pin-pop ring-2 ring-moss/70" : ""
            }`}
            style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
          >
            <button
              type="button"
              className="block w-full text-left"
              onClick={() => {
                if (selectMode) onToggleSelect(photo.id);
                else onOpen(photo.id);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt=""
                className="w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                loading={i < 8 ? "eager" : "lazy"}
              />
            </button>

            {photo.pinned && (
              <span className="absolute left-2 top-2 rounded bg-moss/90 px-2 py-0.5 text-[10px] uppercase tracking-wide text-paper">
                Pin
              </span>
            )}

            {selectMode && (
              <span
                className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm border text-xs ${
                  selectedNow
                    ? "border-moss bg-moss text-paper"
                    : "border-white/80 bg-black/30 text-white"
                }`}
              >
                {selectedNow ? "✓" : ""}
              </span>
            )}

            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent p-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
              <span className="truncate">{photo.uploaderName || "匿名"}</span>
              <span>♥ {photo.likeCount}</span>
            </figcaption>

            {isAdmin && !selectMode && (
              <button
                type="button"
                className="absolute bottom-2 right-2 rounded bg-black/55 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(photo.id);
                }}
              >
                {photo.pinned ? "取消置顶" : "置顶"}
              </button>
            )}
          </figure>
        );
      })}
    </div>
  );
}
