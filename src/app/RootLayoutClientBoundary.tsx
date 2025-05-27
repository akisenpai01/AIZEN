
"use client";

// Removed useState and useEffect as theme is now static
// Removed getLocalStorageItem as it's no longer needed here for themes

// Default background image and AI hint
const DEFAULT_BG_IMAGE = "https://media-hosting.imagekit.io/7e8c99534f4d4798/wp9226062-4k-samurai-mobile-wallpapers.jpg?Expires=1840948638&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=r62I1Q4W4YHDy7eiAKqwWodbPFzVNXXwioylagBQi16o1rzM9Y6dcqUPdEi3RT-sYxwAiJdHM74NsQs-Uvb4lM7lUKxM9ZzFbZOMaz9rrmV04KHyqrugDwVIQTOC7C95kY90o42Gd1lmMUznk-27FKLdFA1w82wzZFl0NbXnLu6~E2IIDbm391RQqbef8~TLw2rIRWM6BG0Efgjh4T34zIsevcrRGcsj~LoNgNPR12Kuk6VotvanRGnuSwBoMXj7mAnxLPwAafsbgi~rUxv-mWElzAlUD90cerywZme6rtLYp5g9nQB7e-YWpa3poyalPdIrIB9A-0YyoP8pyWKyow__";
const DEFAULT_DATA_AI_HINT = 'samurai landscape';

// Removed ThemeOption interface, availableThemes array, and AIZEN_THEME_KEY constant

export function RootLayoutClientBoundary({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No longer needs state for currentBgImage or currentDataAiHint
  // No longer needs useEffect to load theme from localStorage

  return (
    <>
      <div
        id="app-background"
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-all duration-500 ease-in-out"
        style={{ backgroundImage: `url('${DEFAULT_BG_IMAGE}')` }}
        data-ai-hint={DEFAULT_DATA_AI_HINT}
        aria-hidden="true"
      />
      <div className="relative min-h-screen flex flex-col">
        {children}
      </div>
    </>
  );
}
