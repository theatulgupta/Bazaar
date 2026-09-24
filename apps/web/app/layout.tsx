import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const display = Fraunces({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: { default: 'Bazaar', template: '%s · Bazaar' },
  description: 'A warm marketplace for electronics, clothing, and jewellery.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="bg-canvas font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
