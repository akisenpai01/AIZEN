
"use client";

import { useEffect, useState } from 'react';
import { getLocalStorageItem } from '@/lib/localStorageUtils';

// Define available themes - ensure this is consistent with other uses (e.g., AizenSettings)
// Consider moving to a shared constants file if used in multiple places
export interface ThemeOption { // Exporting the type
  name: string;
  bgImage: string;
  dataAiHint: string;
}

export const availableThemes: ThemeOption[] = [
  { name: 'Default', bgImage: "https://media-hosting.imagekit.io/7e8c99534f4d4798/wp9226062-4k-samurai-mobile-wallpapers.jpg?Expires=1840948638&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=r62I1Q4W4YHDy7eiAKqwWodbPFzVNXXwioylagBQi16o1rzM9Y6dcqUPdEi3RT-sYxwAiJdHM74NsQs-Uvb4lM7lUKxM9ZzFbZOMaz9rrmV04KHyqrugDwVIQTOC7C95kY90o42Gd1lmMUznk-27FKLdFA1w82wzZFl0NbXnLu6~E2IIDbm391RQqbef8~TLw2rIRWM6BG0Efgjh4T34zIsevcrRGcsj~LoNgNPR12Kuk6VotvanRGnuSwBoMXj7mAnxLPwAafsbgi~rUxv-mWElzAlUD90cerywZme6rtLYp5g9nQB7e-YWpa3poyalPdIrIB9A-0YyoP8pyWKyow__", dataAiHint: 'samurai landscape' },
  { name: 'Serene Garden', bgImage: 'https://placehold.co/1920x1080/A9D1A9/333333.png', dataAiHint: 'zen garden' },
  { name: 'Dojo Training', bgImage: 'https://placehold.co/1920x1080/D2B48C/333333.png', dataAiHint: 'dojo interior' },
  { name: 'Moonlit Night', bgImage: 'https://placehold.co/1920x1080/2C3E50/FFFFFF.png', dataAiHint: 'moon night' },
];
export const AIZEN_THEME_KEY = 'aizen_theme_name';


export function RootLayoutClientBoundary({
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
        if (newSelectedTheme) {
          setCurrentBgImage(newSelectedTheme.bgImage);
          setCurrentDataAiHint(newSelectedTheme.dataAiHint);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  return (
    <>
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
    </>
  );
}

