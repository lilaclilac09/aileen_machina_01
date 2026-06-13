import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { LanguageProvider } from '../components/LanguageProvider';
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
      <body className="dark" style={{ height: '100%', overflow: 'hidden' }}>
        <LanguageProvider>{children}</LanguageProvider>
        <AgentChat />
        <Analytics />
      </body>
    </html>
  );
}