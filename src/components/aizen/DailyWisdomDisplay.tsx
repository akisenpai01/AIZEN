// src/components/aizen/DailyWisdomDisplay.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface DailyWisdomDisplayProps {
  wisdom: string | null;
}

export function DailyWisdomDisplay({ wisdom }: DailyWisdomDisplayProps) {
  return (
    <Card className="m-2 mb-0 rounded-lg shadow-md bg-secondary/70 backdrop-blur-sm border-border/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center">
          <Lightbulb className="h-4 w-4 mr-2 text-accent" />
          Aizen's Reflection
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {wisdom ? (
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            &ldquo;{wisdom}&rdquo;
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Aizen is gathering his thoughts...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
