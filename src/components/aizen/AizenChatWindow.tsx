
// src/components/aizen/AizenChatWindow.tsx
"use client";

import { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "./AizenChatMessage";
import { AizenChatMessage } from "./AizenChatMessage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";


interface AizenChatWindowProps {
  messages: Message[];
  isLoading: boolean; 
  onUpdateMessage: (messageId: string, updates: Partial<Message>) => void;
}

export function AizenChatWindow({ messages, isLoading, onUpdateMessage }: AizenChatWindowProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea 
      className="flex-grow p-4 rounded-t-lg" // Adjusted: removed fixed height, flex-grow will fill parent
      ref={scrollAreaRef}
    >
      <div ref={viewportRef} className="space-y-4">
        {messages.map((msg) => (
          <AizenChatMessage key={msg.id} message={msg} onUpdateMessage={onUpdateMessage} />
        ))}
        {/* 
          The explicit loading skeleton previously here is now handled by adding a message with 
          `isLoadingPlaceholder: true` directly to the messages array in `page.tsx`.
          This allows the `AizenChatMessage` component to render a styled "thinking" bubble.
        */}
      </div>
    </ScrollArea>
  );
}

