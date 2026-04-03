import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://intake.plurio.ai'),
  title: 'Intake 2.0 — Privacy-First Traffic Attribution',
  description:
    'Know where your visitors come from. Privacy-first JavaScript library for traffic source attribution with Consent Mode v2, multi-touch attribution, and 11 click ID tracking.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Intake 2.0 — Privacy-First Traffic Attribution',
    description:
      'Privacy-first JavaScript library for traffic source attribution.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-white">
        {children}
        <script src="/intake.js" defer />
      </body>
    </html>
  );
}
