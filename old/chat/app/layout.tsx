import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aileen Machina - Chat',
  description: 'Converse with Aileen, your cyberpunk AI companion with persistent memory',
  keywords: ['AI', 'chat', 'companion', 'cyberpunk', 'voice'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
