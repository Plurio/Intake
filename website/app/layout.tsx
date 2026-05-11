import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://intake.plurio.ai'),
  title: 'Intake — Privacy-First Multi-Touch Attribution Library',
  description:
    'Capture UTMs, click IDs, and customer touchpoints across the full funnel. 5 attribution models, CMP-compatible, ~14 kB. Add in 3 lines of code.',
  keywords: [
    'multi-touch attribution',
    'UTM tracking',
    'click ID capture',
    'privacy-first analytics',
    'consent management',
    'marketing attribution library',
    'first-party data',
  ],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://intake.plurio.ai/',
    siteName: 'Intake',
    title: 'Intake — Privacy-First Multi-Touch Attribution Library',
    description:
      'Capture UTMs, click IDs, and customer touchpoints across the full funnel. 5 attribution models, CMP-compatible, ~14 kB. Add in 3 lines of code.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1024,
        height: 477,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intake — Privacy-First Multi-Touch Attribution Library',
    description:
      'Capture UTMs, click IDs, and customer touchpoints across the full funnel. 5 attribution models, CMP-compatible, ~14 kB. Add in 3 lines of code.',
    images: ['/og-image.jpg'],
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
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KLQSXHNR');`}
        </Script>
      </head>
      <body className="font-sans bg-white">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KLQSXHNR"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
        <script src="/intake.js" defer />
      </body>
    </html>
  );
}
