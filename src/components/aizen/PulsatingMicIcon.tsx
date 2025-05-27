// src/components/aizen/PulsatingMicIcon.tsx
"use client";

import type { LucideProps } from 'lucide-react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PulsatingMicIconProps extends LucideProps {
  isListening: boolean;
  disabled?: boolean;
}

export function PulsatingMicIcon({ isListening, disabled, className, ...props }: PulsatingMicIconProps) {
  if (disabled) {
    return <MicOff className={cn("text-muted-foreground", className)} {...props} />;
  }

  return (
    <Mic
      className={cn(
        isListening ? 'animate-pulsate-mic text-accent' : 'text-foreground',
        className
      )}
      {...props}
    />
  );
}
