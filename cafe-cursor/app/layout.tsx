import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { LanguageProvider } from "@/components/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cafe Cursor | Get your Cursor credits",
  description: "Cafe Cursor Shanghai — Get your Cursor credits after check-in.",
  keywords: ["cursor", "credits", "Shanghai", "Cafe Cursor"],
  authors: [{ name: "Cafe Cursor Shanghai" }],
  openGraph: {
    title: "Cafe Cursor Shanghai",
    description: "Get your Cursor credits after check-in",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
