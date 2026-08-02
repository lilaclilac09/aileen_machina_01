"use client";

import { FormEvent, useState } from "react";
import { prepareImage } from "@/lib/clientImage";
import { MAX_FILES_PER_UPLOAD, MAX_REQUEST_BYTES } from "@/lib/constants";

type Props = {
  slug: string;
  nickname: string;
  onNickname: (n: string) => void;
  onClose: () => void;
  onDone: () => void;
};

type Skip = { name: string; reason: string };

export function UploadPanel({ slug, nickname, onNickname, onClose, onDone }: Props) {
  const [name, setName] = useState(nickname);
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [skipped, setSkipped] = useState<Skip[]>([]);

  async function uploadOne(file: File, nick: string): Promise<Skip | null> {
    const form = new FormData();
    form.set("nickname", nick);

    try {
      const prepared = await prepareImage(file);
      form.append("files", prepared.full, `${file.name.replace(/\.\w+$/, "")}.jpg`);
      form.append("thumbs", prepared.thumb, "thumb.jpg");
      form.set("width", String(prepared.width));
      form.set("height", String(prepared.height));
    } catch {
      // Browser could not decode it; let the server try, if it fits a request.
      if (file.size > MAX_REQUEST_BYTES) {
        return { name: file.name, reason: "无法在浏览器处理且文件过大 / cannot process" };
      }
      form.append("files", file);
    }

    const res = await fetch(`/api/albums/${slug}/photos`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { name: file.name, reason: data.error || `上传失败 (${res.status})` };
    }
    const serverSkip = (data.skipped as Skip[])?.[0];
    return serverSkip ?? null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    const nick = name.trim();
    onNickname(nick);
    setBusy(true);
    setSkipped([]);

    const queue = Array.from(files).slice(0, MAX_FILES_PER_UPLOAD);
    const failures: Skip[] = [];
    let uploaded = 0;

    for (const [index, file] of queue.entries()) {
      setProgress(`处理并上传 ${index + 1}/${queue.length}…`);
      try {
        const skip = await uploadOne(file, nick);
        if (skip) failures.push(skip);
        else uploaded += 1;
      } catch (err) {
        failures.push({
          name: file.name,
          reason: err instanceof Error ? err.message : "上传失败",
        });
      }
    }

    setSkipped(failures);
    setProgress(
      failures.length
        ? `已上传 ${uploaded} 张，${failures.length} 张失败`
        : `已上传 ${uploaded} 张`
    );

    if (uploaded > 0) {
      setTimeout(() => onDone(), failures.length ? 1500 : 0);
    } else {
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
        <p className="mt-1 text-sm text-ink/55">
          一次最多 {MAX_FILES_PER_UPLOAD} 张，会在手机上先压缩再逐张上传
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
