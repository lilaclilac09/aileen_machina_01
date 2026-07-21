"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlbumToolbar } from "@/components/AlbumToolbar";
import { PhotoGrid } from "@/components/PhotoGrid";
import { Lightbox } from "@/components/Lightbox";
import { UploadPanel } from "@/components/UploadPanel";
import { SharePanel } from "@/components/SharePanel";
import { AdminUnlock } from "@/components/AdminUnlock";

export type AlbumMeta = {
  id: string;
  slug: string;
  title: string;
  expiresAt: string;
  daysLeft: number;
  expired: boolean;
  uploadLocked: boolean;
  photoCount: number;
  maxPhotos: number;
  url: string;
  isAdmin: boolean;
};

export type PhotoItem = {
  id: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  uploaderName: string;
  caption?: string;
  pinned: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
};

export function AlbumClient({ slug }: { slug: string }) {
  const [album, setAlbum] = useState<AlbumMeta | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    try {
      const n = localStorage.getItem("gather_nickname") || "";
      setNickname(n);
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/albums/${slug}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Load failed");
    setAlbum(data.album);
    setPhotos(data.photos);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const activeIndex = useMemo(
    () => photos.findIndex((p) => p.id === activeId),
    [photos, activeId]
  );

  function persistNickname(n: string) {
    setNickname(n);
    try {
      localStorage.setItem("gather_nickname", n);
    } catch {
      /* ignore */
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (!album?.isAdmin || selected.size === 0) return;
    if (!confirm(`删除选中的 ${selected.size} 张照片？`)) return;
    const res = await fetch(`/api/albums/${slug}/photos/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds: Array.from(selected) }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Delete failed");
      return;
    }
    setSelected(new Set());
    setSelectMode(false);
    await refresh();
  }

  async function togglePin(id: string) {
    const res = await fetch(`/api/albums/${slug}/photos/${id}/pin`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Pin failed");
      return;
    }
    await refresh();
  }

  async function toggleLike(id: string) {
    const res = await fetch(`/api/albums/${slug}/photos/${id}/like`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) return;
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likeCount: data.likeCount } : p))
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink/50">
        加载中…
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-3xl">找不到相册</p>
        <p className="text-ink/60">{error || "Not found"}</p>
        <Link href="/" className="btn-primary">
          创建新相册
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color:var(--paper)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link href="/" className="text-xs uppercase tracking-[0.2em] text-moss">
              Gather · 共影
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl">{album.title}</h1>
            <p className="mt-1 text-sm text-ink/55">
              {album.photoCount}/{album.maxPhotos} 张 · 剩余 {album.daysLeft} 天
              {album.expired ? " · 已过期" : ""}
              {album.isAdmin ? " · 管理员" : ""}
            </p>
          </div>
          <AlbumToolbar
            isAdmin={album.isAdmin}
            selectMode={selectMode}
            selectedCount={selected.size}
            uploadLocked={album.uploadLocked}
            onShare={() => setShowShare(true)}
            onUpload={() => setShowUpload(true)}
            onToggleSelect={() => {
              setSelectMode((v) => !v);
              setSelected(new Set());
            }}
            onDeleteSelected={deleteSelected}
            onAdmin={() => setShowAdmin(true)}
            onToggleLock={async () => {
              const res = await fetch(`/api/albums/${slug}/admin`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadLocked: !album.uploadLocked }),
              });
              if (res.ok) await refresh();
            }}
          />
        </div>
      </header>

      <PhotoGrid
        photos={photos}
        selectMode={selectMode}
        selected={selected}
        isAdmin={album.isAdmin}
        onOpen={(id) => setActiveId(id)}
        onToggleSelect={toggleSelect}
        onPin={togglePin}
      />

      {photos.length === 0 && (
        <div className="mx-auto mt-24 max-w-md px-6 text-center">
          <p className="font-display text-3xl">还没有照片</p>
          <p className="mt-2 text-ink/60">扫码或点上传，把手机里的瞬间放进来。</p>
          {!album.uploadLocked && (
            <button className="btn-primary mt-6" onClick={() => setShowUpload(true)}>
              上传第一批
            </button>
          )}
        </div>
      )}

      {activeId && activeIndex >= 0 && (
        <Lightbox
          photos={photos}
          index={activeIndex}
          slug={slug}
          isAdmin={album.isAdmin}
          nickname={nickname}
          onNickname={persistNickname}
          onClose={() => setActiveId(null)}
          onIndex={(i) => setActiveId(photos[i]?.id ?? null)}
          onLike={toggleLike}
          onPin={togglePin}
          onCommentAdded={() => refresh()}
        />
      )}

      {showShare && (
        <SharePanel url={album.url} title={album.title} onClose={() => setShowShare(false)} />
      )}
      {showUpload && !album.uploadLocked && (
        <UploadPanel
          slug={slug}
          nickname={nickname}
          onNickname={persistNickname}
          onClose={() => setShowUpload(false)}
          onDone={async () => {
            setShowUpload(false);
            await refresh();
          }}
        />
      )}
      {showAdmin && (
        <AdminUnlock
          slug={slug}
          onClose={() => setShowAdmin(false)}
          onUnlocked={async () => {
            setShowAdmin(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
