
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { useEffect, useState } from 'react'; // Added useState and useEffect
import { getLocalStorageItem } from '@/lib/localStorageUtils'; // Added localStorage util

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aizen Companion',
  description: 'Chat with Aizen, the wise samurai AI.',
};

// Define available themes (could be moved to a config file)
// Placeholder images used. Replace with your actual image URLs.
const availableThemes = [
  { name: 'Default', bgImage: "https://media-hosting.imagekit.io/7e8c99534f4d4798/wp9226062-4k-samurai-mobile-wallpapers.jpg?Expires=1840948638&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=r62I1Q4W4YHDy7eiAKqwWodbPFzVNXXwioylagBQi16o1rzM9Y6dcqUPdEi3RT-sYxwAiJdHM74NsQs-Uvb4lM7lUKxM9ZzFbZOMaz9rrmV04KHyqrugDwVIQTOC7C95kY90o42Gd1lmMUznk-27FKLdFA1w82wzZFl0NbXnLu6~E2IIDbm391RQqbef8~TLw2rIRWM6BG0Efgjh4T34zIsevcrRGcsj~LoNgNPR12Kuk6VotvanRGnuSwBoMXj7mAnxLPwAafsbgi~rUxv-mWElzAlUD90cerywZme6rtLYp5g9nQB7e-YWpa3poyalPdIrIB9A-0YyoP8pyWKyow__", dataAiHint: 'samurai landscape' },
  { name: 'Serene Garden', bgImage: 'https://placehold.co/1920x1080/A9A9A9/FFFFFF.png?text=Serene+Garden', dataAiHint: 'zen garden' },
  { name: 'Dojo Training', bgImage: 'https://placehold.co/1920x1080/2F4F4F/FFFFFF.png?text=Dojo+Training', dataAiHint: 'dojo interior' },
  { name: 'Moonlit Night', bgImage: 'https://placehold.co/1920x1080/483D8B/FFFFFF.png?text=Moonlit+Night', dataAiHint: 'moon night' },
];
const AIZEN_THEME_KEY = 'aizen_theme_name';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentBgImage, setCurrentBgImage] = useState(availableThemes[0].bgImage);
  const [currentDataAiHint, setCurrentDataAiHint] = useState(availableThemes[0].dataAiHint);

  useEffect(() => {
    // This effect runs only on the client after hydration
    const storedThemeName = getLocalStorageItem<string | null>(AIZEN_THEME_KEY, null);
    const selectedTheme = availableThemes.find(t => t.name === storedThemeName) || availableThemes[0];
    setCurrentBgImage(selectedTheme.bgImage);
    setCurrentDataAiHint(selectedTheme.dataAiHint);

    // Optional: Listen for storage changes to sync across tabs, though AizenSettings should handle updates.
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AIZEN_THEME_KEY) {
        const newThemeName = event.newValue;
        const newSelectedTheme = availableThemes.find(t => t.name === newThemeName) || availableThemes[0];
        setCurrentBgImage(newSelectedTheme.bgImage);
        setCurrentDataAiHint(newSelectedTheme.dataAiHint);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} antialiased`}>
        <div 
          id="app-background"
          className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-all duration-500 ease-in-out"
          style={{ backgroundImage: `url('${currentBgImage}')` }}
          data-ai-hint={currentDataAiHint}
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
