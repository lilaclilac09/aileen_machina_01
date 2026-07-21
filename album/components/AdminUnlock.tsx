"use client";

import { FormEvent, useState } from "react";

type Props = {
  slug: string;
  onClose: () => void;
  onUnlocked: () => void;
};

export function AdminUnlock({ slug, onClose, onUnlocked }: Props) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/albums/${slug}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <form
        onSubmit={onSubmit}
        className="animate-rise w-full max-w-md rounded-lg border border-[var(--line)] bg-paper p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">管理员解锁</h2>
          <button type="button" className="text-sm text-ink/50" onClick={onClose}>
            关闭
          </button>
        </div>
        <p className="mt-2 text-sm text-ink/60">
          输入创建相册时显示的 admin secret，可置顶、多选删除、锁定上传。
        </p>
        <input
          className="field mt-4 font-mono"
          placeholder="admin secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          required
        />
        {error && <p className="mt-2 text-sm text-ember">{error}</p>}
        <button className="btn-primary mt-5 w-full" disabled={busy} type="submit">
          {busy ? "验证中…" : "解锁"}
        </button>
      </form>
    </div>
  );
}
