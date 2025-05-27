// src/components/aizen/AizenChatWindow.tsx
"use client";

import { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "./AizenChatMessage";
import { AizenChatMessage } from "./AizenChatMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Added AvatarImage, AvatarFallback
import { Card, CardContent } from "@/components/ui/card";

interface AizenChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export function AizenChatWindow({ messages, isLoading }: AizenChatWindowProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea 
      className="flex-grow h-[calc(100vh-160px)] p-4 rounded-t-lg" // Removed bg-background/30 backdrop-blur-sm for transparency
      ref={scrollAreaRef}
    >
      <div ref={viewportRef} className="space-y-4">
        {messages.map((msg) => (
          <AizenChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length-1]?.sender === 'user' && ( // Show loading only if user was the last sender
          <div className="flex items-end gap-2 mb-4 justify-start">
            <Avatar className="w-10 h-10 self-start">
              <AvatarImage src="https://placehold.co/100x100/000000/FFFFFF.png?text=A" alt="Aizen" data-ai-hint="samurai mask"/>
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <Card className="max-w-[70%] p-0 shadow-lg bg-secondary/80 rounded-tr-xl rounded-bl-xl rounded-br-xl border-border/50">
              <CardContent className="p-3">
                <Skeleton className="h-4 w-8" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
