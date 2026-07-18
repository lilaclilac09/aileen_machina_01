"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HostPayload {
  success?: boolean;
  error?: string;
  checkinCode?: string;
  redeemUrl?: string;
  qrImageUrl?: string;
  tips?: string[];
}

/**
 * Organizer page: printable QR that auto-fills the venue check-in code.
 * Protect with admin login — share the QR publicly, not this page.
 */
export default function HostPage() {
  const router = useRouter();
  const [data, setData] = useState<HostPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    fetch(`/api/host?origin=${encodeURIComponent(origin)}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin");
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch(() => setData({ error: "Failed to load host kit" }))
      .finally(() => setLoading(false));
  }, [router]);

  const copyLink = async () => {
    if (!data?.redeemUrl) return;
    await navigator.clipboard.writeText(data.redeemUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        Loading host kit...
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0a] px-4 text-center text-white">
        <p className="text-red-400">{data.error}</p>
        <Link href="/admin" className="underline text-sm text-gray-300">
          Go to admin login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-10">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-500 print:hidden">
          Host kit · do not share this page
        </p>
        <h1 className="mb-1 text-center text-3xl font-bold tracking-tight">
          Cafe Cursor Shanghai
        </h1>
        <p className="mb-8 text-center text-sm text-gray-600">
          Scan after check-in · code fills automatically
        </p>

        {data?.qrImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.qrImageUrl}
            alt="Redeem QR code"
            className="mb-6 h-72 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
          />
        )}

        <div className="mb-6 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
            Door check-in code
          </p>
          <p className="font-mono text-2xl font-semibold tracking-wide">
            {data?.checkinCode}
          </p>
        </div>

        <div className="mb-6 w-full break-all rounded-2xl border border-gray-200 p-4 text-center font-mono text-xs text-gray-700">
          {data?.redeemUrl}
        </div>

        <div className="mb-8 flex w-full flex-col gap-3 print:hidden">
          <button
            type="button"
            onClick={copyLink}
            className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white"
          >
            {copied ? "Copied!" : "Copy redeem link"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium"
          >
            Print QR poster
          </button>
          <Link
            href="/admin/dashboard"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-medium"
          >
            Back to admin
          </Link>
        </div>

        <ul className="w-full space-y-2 text-left text-sm text-gray-600 print:hidden">
          {(data?.tips || []).map((tip) => (
            <li key={tip} className="flex gap-2">
              <span aria-hidden>•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
