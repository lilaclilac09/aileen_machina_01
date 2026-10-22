import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { LanguageProvider } from '../components/LanguageProvider';
import { ThemeProvider } from '../components/ThemeProvider';
import AgentChat from '../components/AgentChat';
import DuoDocumentSync from '../components/DuoDocumentSync';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL, TITLE_BRAND, jsonLdString, siteJsonLd } from '../lib/jsonLd';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s · ${TITLE_BRAND}` },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: './' },
  openGraph: { type: 'website', siteName: SITE_NAME, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, url: './' },
  twitter: { card: 'summary_large_image', title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
};

/** iPhone Safari: env(safe-area-inset-*) only applies with viewport-fit=cover. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
          href="https://fonts.googleapis.com/css2?family=Allura&family=Nunito:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="site-body">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd()) }} />
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
          <DuoDocumentSync />
          <AgentChat />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
