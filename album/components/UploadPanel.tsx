"use client";

import { FormEvent, useState } from "react";

type Props = {
  slug: string;
  nickname: string;
  onNickname: (n: string) => void;
  onClose: () => void;
  onDone: () => void;
};

export function UploadPanel({ slug, nickname, onNickname, onClose, onDone }: Props) {
  const [name, setName] = useState(nickname);
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [skipped, setSkipped] = useState<{ name: string; reason: string }[]>([]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    const nick = name.trim();
    onNickname(nick);
    setBusy(true);
    setSkipped([]);
    setProgress("上传中…");
    try {
      const form = new FormData();
      form.set("nickname", nick);
      Array.from(files)
        .slice(0, 20)
        .forEach((f) => form.append("files", f));
      const res = await fetch(`/api/albums/${slug}/photos`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const skipList = (data.skipped as { name: string; reason: string }[]) || [];
      setSkipped(skipList);
      setProgress(
        skipList.length
          ? `已上传 ${data.uploaded} 张，${skipList.length} 张跳过`
          : `已上传 ${data.uploaded} 张`
      );
      if (data.uploaded > 0) {
        // brief pause so user can read skip reasons
        setTimeout(() => onDone(), skipList.length ? 1200 : 0);
      } else {
        setBusy(false);
      }
    } catch (err) {
      setProgress(err instanceof Error ? err.message : "失败");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <form
        onSubmit={onSubmit}
        className="animate-rise w-full max-w-md rounded-lg border border-[var(--line)] bg-paper p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">上传照片</h2>
          <button type="button" className="text-sm text-ink/50" onClick={onClose}>
            关闭
          </button>
        </div>
        <p className="mt-1 text-sm text-ink/55">一次最多 20 张，单张 ≤ 15MB</p>
        <p className="mt-1 text-xs text-ink/45">
          iPhone HEIC 若失败：用「照片」分享 → 存储为 JPEG 再传。
        </p>
        <input
          className="field mt-4"
          placeholder="你的昵称（可选）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
        />
        <input
          className="mt-3 block w-full text-sm"
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          capture="environment"
          onChange={(e) => setFiles(e.target.files)}
          required
        />
        {progress && <p className="mt-3 text-sm text-moss">{progress}</p>}
        {skipped.length > 0 && (
          <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-ember">
            {skipped.map((s) => (
              <li key={`${s.name}-${s.reason}`}>
                {s.name}: {s.reason}
              </li>
            ))}
          </ul>
        )}
        <button className="btn-primary mt-5 w-full" disabled={busy} type="submit">
          {busy ? "上传中…" : "开始上传"}
        </button>
      </form>
    </div>
  );
}
