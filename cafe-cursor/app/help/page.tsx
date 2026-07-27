"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import { TicketForm } from "@/components/TicketForm";
import { useLanguage } from "@/components/LanguageContext";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function HelpInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const defaultEmail = (params.get("email") || "").trim();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="pointer-events-none fixed inset-0 bg-grid-pattern opacity-40" />
      <div className="fixed right-4 top-4 z-50">
        <LanguageSelector />
      </div>

      <header className="mb-8 text-center animate-fade-in">
        <p className="mb-2 text-sm text-muted">
          <a href="/" className="underline underline-offset-2 hover:no-underline">
            ← Cafe Cursor
          </a>
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("ticketPageTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          {t("ticketPageSubtitle")}
        </p>
      </header>

      <TicketForm defaultEmail={defaultEmail} />
    </main>
  );
}

/**
 * /help — guest support ticket collection (no inbound cafe@ mailbox required).
 */
export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-muted">
          …
        </main>
      }
    >
      <HelpInner />
    </Suspense>
  );
}
