"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME, APP_NAME_ZH, ALBUM_TTL_DAYS, MAX_PHOTOS_PER_ALBUM } from "@/lib/constants";

export default function HomePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    url: string;
    adminSecret: string;
    slug: string;
  } | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || "Untitled gathering" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCreated({
        url: data.album.url,
        adminSecret: data.adminSecret,
        slug: data.album.slug,
      });
      try {
        sessionStorage.setItem(
          `gather_secret_${data.album.slug}`,
          data.adminSecret
        );
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Full-bleed atmospheric hero plane */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(243,239,230,0.2), rgba(243,239,230,0.85)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221200%22 height=%22800%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop stop-color=%22%23d7cfc0%22/%3E%3Cstop offset=%221%22 stop-color=%22%23b9c4b4%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23g)%22 width=%221200%22 height=%22800%22/%3E%3Cg opacity=%220.35%22%3E%3Crect x=%2280%22 y=%22120%22 width=%22280%22 height=%22360%22 fill=%22%23fff%22 transform=%22rotate(-6 220 300)%22/%3E%3Crect x=%22420%22 y=%2280%22 width=%22320%22 height=%22420%22 fill=%22%23f6f1e8%22 transform=%22rotate(4 580 290)%22/%3E%3Crect x=%22800%22 y=%22160%22 width=%22260%22 height=%22340%22 fill=%22%23e8efe6%22 transform=%22rotate(-3 930 330)%22/%3E%3C/g%3E%3C/svg%3E')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <p className="animate-rise font-display text-5xl tracking-tight text-ink sm:text-7xl md:text-8xl">
          {APP_NAME}
          <span className="ml-3 text-2xl font-sans font-medium text-moss sm:text-3xl">
            {APP_NAME_ZH}
          </span>
        </p>
        <p
          className="animate-rise mt-5 max-w-xl text-lg text-ink/75 sm:text-xl"
          style={{ animationDelay: "80ms" }}
        >
          免注册共享相册 · 人人可传 · {MAX_PHOTOS_PER_ALBUM} 张 · {ALBUM_TTL_DAYS}{" "}
          天 · 点赞评论置顶
        </p>

        {!created ? (
          <form
            onSubmit={onCreate}
            className="animate-rise mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "140ms" }}
          >
            <input
              className="field flex-1"
              placeholder="给这次聚会起个名字…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              autoFocus
            />
            <button className="btn-primary shrink-0" disabled={loading} type="submit">
              {loading ? "创建中…" : "创建相册"}
            </button>
          </form>
        ) : (
          <div
            className="animate-rise mt-10 max-w-xl space-y-4 rounded-lg border border-[var(--line)] bg-white/60 p-5 backdrop-blur"
            style={{ animationDelay: "100ms" }}
          >
            <p className="font-display text-2xl">相册已创建</p>
            <p className="text-sm text-ink/70">
              把链接或二维码发给大家。管理员密钥只显示一次，请立刻保存。
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="field break-all text-sm">{created.url}</code>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => navigator.clipboard.writeText(created.url)}
              >
                复制链接
              </button>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-ink/50">
                Admin secret
              </p>
              <code className="field block font-mono text-base">{created.adminSecret}</code>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr?url=${encodeURIComponent(created.url)}`}
              alt="QR code"
              className="mx-auto h-44 w-44"
            />
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => router.push(`/a/${created.slug}`)}
            >
              进入相册
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-ember">{error}</p>}

        <p
          className="animate-fade mt-16 text-sm text-ink/45"
          style={{ animationDelay: "300ms" }}
        >
          by{" "}
          <a className="underline decoration-moss/40 underline-offset-4" href="https://aileena.xyz">
            aileena.xyz
          </a>
          {" · "}
          album.aileena.xyz
        </p>
      </div>
    </main>
  );
}
