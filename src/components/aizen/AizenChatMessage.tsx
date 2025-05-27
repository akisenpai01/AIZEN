// src/components/aizen/AizenChatMessage.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image"; // Kept for potential future use with images

export type Message = {
  id: string;
  sender: 'user' | 'aizen';
  text: string;
  timestamp?: Date;
  isLoadingPlaceholder?: boolean; // For temporary wisdom loading message
};

interface AizenChatMessageProps {
  message: Message;
}

export function AizenChatMessage({ message }: AizenChatMessageProps) {
  const isAizen = message.sender === 'aizen';

  if (message.isLoadingPlaceholder && isAizen) {
    // Render a simplified thinking/loading bubble for wisdom
    return (
      <div className={cn("flex items-end gap-2 mb-4 justify-start")}>
        <Avatar className="w-10 h-10 self-start">
          <AvatarImage src="https://placehold.co/100x100/000000/FFFFFF.png?text=A" alt="Aizen" data-ai-hint="samurai mask"/>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <Card 
          className={cn(
            "max-w-[70%] p-0 shadow-lg bg-secondary/80 rounded-tr-xl rounded-bl-xl rounded-br-xl border-border/50 animate-pulse"
          )}
        >
          <CardContent className="p-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed italic">{message.text}</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className={cn("flex items-end gap-2 mb-4", isAizen ? "justify-start" : "justify-end")}>
      {isAizen && (
        <Avatar className="w-10 h-10 self-start">
          <AvatarImage src="https://placehold.co/100x100/000000/FFFFFF.png?text=A" alt="Aizen" data-ai-hint="samurai mask"/>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
      )}
      <Card 
        className={cn(
          "max-w-[70%] p-0 shadow-lg", 
          isAizen ? "bg-secondary/80 rounded-tr-xl rounded-bl-xl rounded-br-xl" : "bg-primary/80 text-primary-foreground rounded-tl-xl rounded-br-xl rounded-bl-xl",
          "border-border/50"
        )}
      >
        <CardContent className="p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
          {message.timestamp && (
            <p className={cn("text-xs mt-1", isAizen ? "text-muted-foreground text-right" : "text-primary-foreground/70 text-right")}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </CardContent>
      </Card>
       {!isAizen && (
        <Avatar className="w-10 h-10 self-start">
           <AvatarImage src="https://placehold.co/100x100/FFFFFF/000000.png?text=U" alt="User" data-ai-hint="person silhouette"/>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
