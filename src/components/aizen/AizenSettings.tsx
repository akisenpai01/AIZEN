
// src/components/aizen/AizenSettings.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CustomSpeechSynthesisVoice } from "@/hooks/useSpeechSynthesis";
import { Settings, Volume2, VolumeX, Palette, Trash2, BookOpen } from "lucide-react"; // Added Trash2, BookOpen
import type { ThemeOption } from '@/app/RootLayoutClientBoundary'; // Using ThemeOption type
import { Separator } from "@/components/ui/separator";

interface AizenSettingsProps {
  voices: CustomSpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  onVoiceChange: (voiceURI: string | null) => void;
  ttsEnabled: boolean;
  onTtsToggle: (enabled: boolean) => void;
  isSpeechSynthesisSupported: boolean;
  // Theme props
  availableThemes: ThemeOption[];
  selectedThemeName: string;
  onThemeChange: (themeName: string) => void;
  // Chat Actions
  onClearChat: () => void;
  onViewHistory: () => void;
}

export function AizenSettings({
  voices,
  selectedVoiceURI,
  onVoiceChange,
  ttsEnabled,
  onTtsToggle,
  isSpeechSynthesisSupported,
  availableThemes,
  selectedThemeName,
  onThemeChange,
  onClearChat,
  onViewHistory,
}: AizenSettingsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-accent hover:bg-accent/20 hover:text-accent"
          suppressHydrationWarning={true}
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">Open Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover/90 backdrop-blur-md border-border/50 text-popover-foreground">
        <div className="grid gap-6">

          {/* Interface Settings */}
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Interface</h4>
            <p className="text-sm text-muted-foreground">
              Customize appearance.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
                <Label htmlFor="theme-select" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Ambiance
                </Label>
            </div>
            <Select
                value={selectedThemeName}
                onValueChange={onThemeChange}
            >
                <SelectTrigger id="theme-select" className="bg-input/80 border-border/70">
                <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/70">
                {availableThemes.map((theme) => (
                    <SelectItem key={theme.name} value={theme.name}>
                    {theme.name}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Voice Settings */}
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Voice Output</h4>
            <p className="text-sm text-muted-foreground">
              Customize Aizen's voice.
            </p>
          </div>
          {isSpeechSynthesisSupported ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="tts-toggle" className="flex items-center gap-2">
                 {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                  Enable Speech
                </Label>
                <Switch
                  id="tts-toggle"
                  checked={ttsEnabled}
                  onCheckedChange={onTtsToggle}
                  aria-label="Toggle Text-to-Speech"
                />
              </div>
              {ttsEnabled && (
                <div className="grid gap-1">
                  <Label htmlFor="voice-select">Aizen's Voice</Label>
                  <Select
                    value={selectedVoiceURI || ""}
                    onValueChange={(value) => onVoiceChange(value || null)}
                    disabled={voices.length === 0}
                  >
                    <SelectTrigger id="voice-select" className="bg-input/80 border-border/70">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/70">
                      {voices.length > 0 ? voices.map((voice, index) => (
                        <SelectItem key={`${voice.voiceURI}-${index}`} value={voice.voiceURI}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      )) : <SelectItem value="no-voice" disabled>No voices available</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-destructive">
              Speech synthesis is not supported.
            </p>
          )}

          <Separator />

          {/* Chat Actions */}
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Chat Management</h4>
            <p className="text-sm text-muted-foreground">
              Manage your conversation.
            </p>
          </div>
          <div className="grid gap-3">
            <Button variant="outline" onClick={onViewHistory} className="w-full justify-start bg-input/80 border-border/70 hover:bg-accent/20">
              <BookOpen className="mr-2 h-4 w-4" /> View Chat History
            </Button>
            <Button variant="destructive" onClick={onClearChat} className="w-full justify-start">
              <Trash2 className="mr-2 h-4 w-4" /> Clear Current Chat
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
