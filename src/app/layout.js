import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Setly — La scène la plus proche est à un swipe',
  description: 'Setly connecte artistes musicaux et établissements pour organiser des soirées.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0A0A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎵</text></svg>" />
      </head>
      <body className="bg-bg min-h-screen">
        <Navbar />
        <main className="pt-14 sm:pt-16">{children}</main>
      </body>
    </html>
  );
}
