// src/components/aizen/AizenChatWindow.tsx
"use client";

import { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "./AizenChatMessage";
import { AizenChatMessage } from "./AizenChatMessage";
// Skeleton, Avatar, Card, CardContent imports are removed as the explicit thinking message is handled in page.tsx and AizenChatMessage

interface AizenChatWindowProps {
  messages: Message[];
  isLoading: boolean; // This can be used for a general loading state if needed, but specific "Aizen thinking" bubble is preferred
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
      className="flex-grow h-[calc(100vh-160px)] p-4 rounded-t-lg"
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
          The `isLoading` prop here might still be useful for a more generic overlay if desired in the future.
        */}
      </div>
    </ScrollArea>
  );
}
