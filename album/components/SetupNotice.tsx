"use client";

import { useEffect, useState } from "react";

type Check = { ok: boolean; detail: string };
type Health = {
  ready: boolean;
  database: Check;
  env: Record<string, Check>;
};

/**
 * Shown only while the deployment cannot serve albums, so whoever opens the
 * site sees which environment variable is still wrong.
 */
export function SetupNotice() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = (await res.json()) as Health;
        if (!cancelled && !data.ready) setHealth(data);
      } catch {
        /* offline or blocked — stay quiet */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!health) return null;

  const problems = Object.entries(health.env)
    .filter(([, check]) => !check.ok)
    .map(([name, check]) => `${name}: ${check.detail}`);
  if (!health.database.ok) problems.unshift(`数据库: ${health.database.detail}`);

  return (
    <div className="animate-fade mb-6 rounded-lg border border-ember/40 bg-ember/10 p-4 text-sm">
      <p className="font-medium text-ink">还差一步配置，暂时无法创建相册</p>
      <ul className="mt-2 space-y-1 text-ink/70">
        {problems.map((problem) => (
          <li key={problem}>· {problem}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink/50">
        在 Vercel → Settings → Environment Variables 修好后 Redeploy，详见
        album/DEPLOY.md
      </p>
    </div>
  );
}
