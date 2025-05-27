
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { RootLayoutClientBoundary } from './RootLayoutClientBoundary'; // New client boundary

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aizen Companion',
  description: 'Chat with Aizen, the wise samurai AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} antialiased`}>
        <RootLayoutClientBoundary>
          {children}
        </RootLayoutClientBoundary>
        <Toaster />
      </body>
    </html>
  );
}
