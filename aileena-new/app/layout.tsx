import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '../components/LanguageProvider';

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
      <body className="bg-black text-white" style={{ height: '100%', overflow: 'hidden' }}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}