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

function PinBadge({ mode }: { mode: string }) {
  if (mode === "center") {
    return (
      <span className="absolute left-2 top-2 rounded bg-ember/95 px-2 py-0.5 text-[10px] uppercase tracking-wide text-paper">
        中心
      </span>
    );
  }
  if (mode === "front") {
    return (
      <span className="absolute left-2 top-2 rounded bg-moss/90 px-2 py-0.5 text-[10px] uppercase tracking-wide text-paper">
        开头
      </span>
    );
  }
  return null;
}

function pinLabel(mode: string) {
  if (mode === "none") return "置顶开头";
  if (mode === "front") return "置顶中心";
  return "取消置顶";
}

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

  const center = photos.filter((p) => p.pinMode === "center");
  const rest = photos.filter((p) => p.pinMode !== "center");

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6">
      {center.length > 0 && (
        <section className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-moss">Pinned · 中心</p>
          <div
            className={`grid gap-3 ${
              center.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {center.map((photo) => {
              const selectedNow = selected.has(photo.id);
              return (
                <figure
                  key={photo.id}
                  className="animate-pin-pop group relative overflow-hidden rounded-sm bg-mist/40 ring-2 ring-ember/60"
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
                      className="max-h-[70vh] w-full object-cover transition duration-500 group-hover:scale-[1.01]"
                      loading="eager"
                    />
                  </button>
                  <PinBadge mode="center" />
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
                  {isAdmin && !selectMode && (
                    <button
                      type="button"
                      className="absolute bottom-3 right-3 rounded bg-black/55 px-2 py-1 text-[10px] text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPin(photo.id);
                      }}
                    >
                      {pinLabel(photo.pinMode)}
                    </button>
                  )}
                </figure>
              );
            })}
          </div>
        </section>
      )}

      <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 md:columns-4">
        {rest.map((photo, i) => {
          const selectedNow = selected.has(photo.id);
          return (
            <figure
              key={photo.id}
              className={`animate-rise group relative mb-3 break-inside-avoid overflow-hidden rounded-sm bg-mist/40 sm:mb-4 ${
                photo.pinMode === "front" ? "animate-pin-pop ring-2 ring-moss/70" : ""
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

              <PinBadge mode={photo.pinMode} />

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
                  {pinLabel(photo.pinMode)}
                </button>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}
