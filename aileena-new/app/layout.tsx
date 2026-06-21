import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { LanguageProvider } from '../components/LanguageProvider';
import { ThemeProvider } from '../components/ThemeProvider';
import AgentChat from '../components/AgentChat';

export const metadata: Metadata = {
  title: 'AILEENA — MACHINA',
  description: 'AILEENA MACHINA - EST 2025',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Allura — flowing coral cursive used in the Visual film-credit
            overlay. Loaded via runtime <link> rather than next/font/google
            so it works on networks where the build can't reach Google. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Allura&display=swap"
        />
      </head>
      <body style={{ height: '100%', overflow: 'hidden' }}>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
          <AgentChat />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
