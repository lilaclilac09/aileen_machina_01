import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { LanguageProvider } from "@/components/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cafe Cursor | 领取免费 Cursor 学分",
  description: "Cafe Cursor Shanghai — 现场签到后领取免费 Cursor IDE 学分。",
  keywords: ["cursor", "ide", "学分", "上海", "Cafe Cursor"],
  authors: [{ name: "Cafe Cursor Shanghai" }],
  openGraph: {
    title: "Cafe Cursor Shanghai",
    description: "现场签到后领取免费 Cursor IDE 学分",
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
