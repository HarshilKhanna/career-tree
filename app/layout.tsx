import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#F7F5F0',
};

export const metadata: Metadata = {
  title: 'CareerTree — Explore Every Career Path',
  description:
    'An interactive career path decision tree for students and graduates. Input your degree and country to explore every career path available to you.',
  keywords: ['career paths', 'B.Tech', 'engineering careers', 'career tree', 'India careers'],
  openGraph: {
    title: 'CareerTree',
    description: 'Explore every career path available to you, interactively.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ fontFamily: 'var(--font-sans)' }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
