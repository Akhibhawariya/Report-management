import './globals.css';
import { Inter } from 'next/font/google';
import { Nav } from '../components/Nav';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'NGO Reports — Submissions',
  description: 'Submit monthly NGO impact data (single or CSV) and review the dashboard.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex min-h-full flex-col antialiased`}>
        <Nav />
        <main className="relative flex-1">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</div>
        </main>
        <footer
          className="border-t border-slate-800/40 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 py-5"
          aria-hidden
        />
      </body>
    </html>
  );
}
