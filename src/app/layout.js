import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Setly — La scène la plus proche est à un swipe',
  description: 'Setly connecte artistes musicaux et établissements pour organiser des soirées.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-bg min-h-screen">
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
