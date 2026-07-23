"use client";

import { useState } from "react";
import { copyText, shareOrCopy } from "@/lib/clipboard";

type Props = {
  url: string;
  title: string;
  onClose: () => void;
};

export function SharePanel({ url, title, onClose }: Props) {
  const [hint, setHint] = useState("");

  async function onCopy() {
    const ok = await copyText(url);
    setHint(ok ? "已复制" : "复制失败，请长按链接手动复制");
  }

  async function onShare() {
    const result = await shareOrCopy({ title, url });
    if (result === "shared") setHint("已打开系统分享");
    else if (result === "copied") setHint("已复制链接");
    else setHint("请长按链接或二维码分享");
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div className="animate-rise w-full max-w-md rounded-lg border border-[var(--line)] bg-paper p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">分享 · {title}</h2>
          <button type="button" className="text-sm text-ink/50" onClick={onClose}>
            关闭
          </button>
        </div>
        <p className="mt-2 text-sm text-ink/60">扫码或复制链接，微信 / WhatsApp / 短信都行。</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr?url=${encodeURIComponent(url)}`}
          alt="QR"
          className="mx-auto mt-4 h-48 w-48"
        />
        <code className="field mt-4 block break-all text-xs select-all">{url}</code>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost w-full" onClick={onCopy}>
            复制链接
          </button>
          <button type="button" className="btn-primary w-full" onClick={onShare}>
            系统分享
          </button>
        </div>
        {hint && <p className="mt-2 text-center text-sm text-moss">{hint}</p>}
      </div>
    </div>
  );
}
