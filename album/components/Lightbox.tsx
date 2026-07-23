"use client";

import { FormEvent, TouchEvent, useEffect, useRef, useState } from "react";
import type { PhotoItem } from "./AlbumClient";

type Comment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type Props = {
  photos: PhotoItem[];
  index: number;
  slug: string;
  isAdmin: boolean;
  nickname: string;
  onNickname: (n: string) => void;
  onClose: () => void;
  onIndex: (i: number) => void;
  onLike: (id: string) => void;
  onPin: (id: string) => void;
  onCommentAdded: () => void;
};

export function Lightbox({
  photos,
  index,
  slug,
  isAdmin,
  nickname,
  onNickname,
  onClose,
  onIndex,
  onLike,
  onPin,
  onCommentAdded,
}: Props) {
  const photo = photos[index];
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [name, setName] = useState(nickname);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    setName(nickname);
  }, [nickname]);

  useEffect(() => {
    if (!photo) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/albums/${slug}/photos/${photo.id}/comments`);
      const data = await res.json();
      if (!cancelled && res.ok) setComments(data.comments);
    })();
    return () => {
      cancelled = true;
    };
  }, [photo, slug]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(Math.min(photos.length - 1, index + 1));
      if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose, onIndex, photos.length]);

  if (!photo) return null;

  function onTouchStart(e: TouchEvent) {
    touchX.current = e.changedTouches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: TouchEvent) {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) onIndex(Math.min(photos.length - 1, index + 1));
    else onIndex(Math.max(0, index - 1));
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    const authorName = name.trim() || "匿名";
    onNickname(authorName);
    const res = await fetch(`/api/albums/${slug}/photos/${photo.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Comment failed");
      return;
    }
    setComments((c) => [...c, data.comment]);
    setBody("");
    onCommentAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-ink/90 text-paper">
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded bg-white/10 px-3 py-1 text-sm"
        onClick={onClose}
      >
        关闭
      </button>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          className="relative flex min-h-[45vh] flex-1 items-center justify-center p-4 lg:min-h-0"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {index > 0 && (
            <button
              type="button"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/10 px-3 py-2"
              onClick={() => onIndex(index - 1)}
            >
              ‹
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt=""
            className="max-h-[80vh] max-w-full object-contain"
            draggable={false}
          />
          {index < photos.length - 1 && (
            <button
              type="button"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded bg-white/10 px-3 py-2"
              onClick={() => onIndex(index + 1)}
            >
              ›
            </button>
          )}
        </div>

        <aside className="flex w-full flex-col border-t border-white/10 bg-black/30 p-4 lg:w-96 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded bg-white/10 px-3 py-2 text-sm"
              onClick={() => onLike(photo.id)}
            >
              ♥ {photo.likeCount}
            </button>
            {isAdmin && (
              <button
                type="button"
                className="rounded bg-white/10 px-3 py-2 text-sm"
                onClick={() => onPin(photo.id)}
              >
                {photo.pinMode === "none"
                  ? "置顶开头"
                  : photo.pinMode === "front"
                    ? "置顶中心"
                    : "取消置顶"}
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-white/60">
            {photo.uploaderName || "匿名"} ·{" "}
            {new Date(photo.createdAt).toLocaleString()}
          </p>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {comments.map((c) => (
              <div key={c.id} className="rounded bg-white/5 p-2 text-sm">
                <p className="font-medium text-white/90">{c.authorName}</p>
                <p className="text-white/75">{c.body}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-white/40">还没有评论</p>
            )}
          </div>

          <form onSubmit={submitComment} className="mt-3 space-y-2">
            <input
              className="w-full rounded border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
              placeholder="昵称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
            />
            <textarea
              className="w-full rounded border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
              placeholder="写一句评论…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={280}
              rows={2}
              required
            />
            <button type="submit" className="btn-primary w-full !py-2">
              发送评论
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
