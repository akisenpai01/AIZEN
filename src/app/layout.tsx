import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Geist_Mono can be removed if not used explicitly elsewhere
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Removed geistMono if not actively used to reduce bundle size
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

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
      <body className={`${geistSans.variable} antialiased`}> {/* Removed geistMono.variable */}
        <div 
          className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://media-hosting.imagekit.io/7e8c99534f4d4798/wp9226062-4k-samurai-mobile-wallpapers.jpg?Expires=1840948638&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=r62I1Q4W4YHDy7eiAKqwWodbPFzVNXXwioylagBQi16o1rzM9Y6dcqUPdEi3RT-sYxwAiJdHM74NsQs-Uvb4lM7lUKxM9ZzFbZOMaz9rrmV04KHyqrugDwVIQTOC7C95kY90o42Gd1lmMUznk-27FKLdFA1w82wzZFl0NbXnLu6~E2IIDbm391RQqbef8~TLw2rIRWM6BG0Efgjh4T34zIsevcrRGcsj~LoNgNPR12Kuk6VotvanRGnuSwBoMXj7mAnxLPwAafsbgi~rUxv-mWElzAlUD90cerywZme6rtLYp5g9nQB7e-YWpa3poyalPdIrIB9A-0YyoP8pyWKyow__')" }}
          data-ai-hint="samurai landscape"
          aria-hidden="true"
        />
        <div className="relative min-h-screen flex flex-col">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
