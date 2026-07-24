import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_NAME_ZH } from "@/lib/constants";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} · ${APP_NAME_ZH} — shared event album`,
  description:
    "No signup shared photo album. 500 photos · 30 days · like · comment · pin. album.aileena.xyz",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${display.variable} ${sans.variable} font-sans antialiased`}>
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
