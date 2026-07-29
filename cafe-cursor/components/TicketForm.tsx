"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "./LanguageContext";
import {
  CURSOR_SPENDING_URL,
  SUPPORT_CATEGORIES,
  type SupportCategory,
} from "@/lib/support-ticket-types";
import { compressScreenshotToDataUrl } from "@/lib/screenshot-compress";

/**
 * Guest support ticket form — stores in DB + notifies NOTIFY_CC_EMAIL.
 * Spending-page screenshot is required.
 */
export function TicketForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const { t, locale } = useLanguage();
  const [email, setEmail] = useState(defaultEmail);
  const [lumaEmail, setLumaEmail] = useState("");
  const [category, setCategory] = useState<SupportCategory>("credits_not_landed");
  const [message, setMessage] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState("");
  const [screenshotName, setScreenshotName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const [ticketId, setTicketId] = useState("");

  const categoryLabel = (c: SupportCategory): string => {
    switch (c) {
      case "credits_not_landed":
        return t("ticketCatNotLanded");
      case "email_mismatch":
        return t("ticketCatMismatch");
      case "already_claimed":
        return t("ticketCatClaimed");
      default:
        return t("ticketCatOther");
    }
  };

  const handleScreenshot = async (file: File | null) => {
    if (!file) {
      setScreenshotDataUrl("");
      setScreenshotName("");
      return;
    }
    try {
      const dataUrl = await compressScreenshotToDataUrl(file);
      setScreenshotDataUrl(dataUrl);
      setScreenshotName(file.name);
      setError("");
    } catch {
      setScreenshotDataUrl("");
      setScreenshotName("");
      setError(t("ticketScreenshotBad"));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!screenshotDataUrl) {
      setStatus("error");
      setError(t("ticketScreenshotMissing"));
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          lumaEmail: lumaEmail.trim() || undefined,
          category,
          message: message.trim(),
          locale,
          screenshotDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || t("ticketError"));
        return;
      }
      setTicketId(data.id || "");
      setStatus("success");
    } catch {
      setStatus("error");
      setError(t("networkError"));
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center animate-fade-in">
        <h2 className="mb-2 text-xl font-semibold">{t("ticketSuccessTitle")}</h2>
        <p className="mb-4 text-sm text-muted">{t("ticketSuccessBody")}</p>
        {ticketId ? (
          <p className="text-xs text-muted">
            {t("ticketIdLabel")}: <code className="text-foreground">{ticketId}</code>
          </p>
        ) : null}
        <a
          href="/"
          className="mt-6 inline-block text-sm font-medium text-foreground underline underline-offset-2"
        >
          {t("ticketBackHome")}
        </a>
      </div>
    );
  }

  const canSubmit =
    Boolean(email.trim()) &&
    message.trim().length >= 10 &&
    Boolean(screenshotDataUrl) &&
    status !== "loading";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-border bg-background p-8 animate-fade-in"
    >
      <h2 className="mb-1 text-xl font-semibold">{t("ticketTitle")}</h2>
      <p className="mb-6 text-sm text-muted">{t("ticketIntro")}</p>

      <label className="mb-2 block text-sm font-medium" htmlFor="ticket-email">
        {t("ticketEmailLabel")}
      </label>
      <input
        id="ticket-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
        placeholder={t("emailPlaceholder")}
        className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-foreground focus:outline-none disabled:opacity-50"
      />

      <label className="mb-2 block text-sm font-medium" htmlFor="ticket-luma">
        {t("ticketLumaLabel")}
      </label>
      <input
        id="ticket-luma"
        type="email"
        value={lumaEmail}
        onChange={(e) => setLumaEmail(e.target.value)}
        disabled={status === "loading"}
        placeholder={t("ticketLumaPlaceholder")}
        className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-foreground focus:outline-none disabled:opacity-50"
      />

      <label className="mb-2 block text-sm font-medium" htmlFor="ticket-cat">
        {t("ticketCategoryLabel")}
      </label>
      <select
        id="ticket-cat"
        value={category}
        onChange={(e) => setCategory(e.target.value as SupportCategory)}
        disabled={status === "loading"}
        className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-foreground focus:outline-none disabled:opacity-50"
      >
        {SUPPORT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {categoryLabel(c)}
          </option>
        ))}
      </select>

      <label className="mb-2 block text-sm font-medium" htmlFor="ticket-msg">
        {t("ticketMessageLabel")}
      </label>
      <textarea
        id="ticket-msg"
        required
        rows={4}
        minLength={10}
        maxLength={2000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={status === "loading"}
        placeholder={t("ticketMessagePlaceholder")}
        className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-foreground focus:outline-none disabled:opacity-50"
      />

      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <label className="mb-2 block text-sm font-medium" htmlFor="ticket-shot">
          {t("ticketScreenshotLabel")}
        </label>
        <p className="mb-3 text-xs text-muted">{t("ticketScreenshotHint")}</p>
        <a
          href={CURSOR_SPENDING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 inline-block text-xs font-medium text-foreground underline underline-offset-2"
        >
          {t("ticketScreenshotOpen")} →
        </a>
        <input
          id="ticket-shot"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/*"
          required
          disabled={status === "loading"}
          onChange={(e) => handleScreenshot(e.target.files?.[0] || null)}
          className="block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:font-medium file:text-background"
        />
        {screenshotDataUrl ? (
          <div className="mt-3">
            <p className="mb-2 text-xs text-muted">
              ✓ {screenshotName || "screenshot.jpg"}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotDataUrl}
              alt="Spending screenshot preview"
              className="max-h-40 w-full rounded-lg border border-border object-contain bg-black/5"
            />
          </div>
        ) : null}
      </div>

      {status === "error" && error ? (
        <p className="mb-4 text-sm text-[var(--error)]">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-foreground px-4 py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? t("ticketSubmitting") : t("ticketSubmit")}
      </button>

      <p className="mt-4 text-center text-xs text-muted">{t("ticketPrivacyNote")}</p>
    </form>
  );
}
