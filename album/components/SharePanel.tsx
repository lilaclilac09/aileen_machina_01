"use client";

type Props = {
  url: string;
  title: string;
  onClose: () => void;
};

export function SharePanel({ url, title, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
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
        <code className="field mt-4 block break-all text-xs">{url}</code>
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={() => navigator.clipboard.writeText(url)}
        >
          复制链接
        </button>
      </div>
    </div>
  );
}
