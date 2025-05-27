
// src/components/aizen/AizenSettings.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CustomSpeechSynthesisVoice } from "@/hooks/useSpeechSynthesis";
import { Settings, Volume2, VolumeX, Palette } from "lucide-react"; // Added Palette icon
import type { Theme } from '@/app/page'; // Assuming Theme type is exported from page.tsx or a types file

interface AizenSettingsProps {
  voices: CustomSpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  onVoiceChange: (voiceURI: string | null) => void;
  ttsEnabled: boolean;
  onTtsToggle: (enabled: boolean) => void;
  isSpeechSynthesisSupported: boolean;
  // Theme props
  availableThemes: Theme[];
  selectedThemeName: string;
  onThemeChange: (themeName: string) => void;
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
        <div className="grid gap-6"> {/* Increased gap for sections */}
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Interface Settings</h4>
            <p className="text-sm text-muted-foreground">
              Customize Aizen's appearance.
            </p>
          </div>
          <div className="grid gap-2">
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

          <div className="space-y-2">
            <h4 className="font-medium leading-none">Voice Settings</h4>
            <p className="text-sm text-muted-foreground">
              Customize Aizen's voice and speech.
            </p>
          </div>
          {isSpeechSynthesisSupported ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tts-toggle">Voice Output (TTS)</Label>
                <div className="flex items-center gap-2">
                  {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                  <Switch
                    id="tts-toggle"
                    checked={ttsEnabled}
                    onCheckedChange={onTtsToggle}
                    aria-label="Toggle Text-to-Speech"
                  />
                </div>
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
              Speech synthesis is not supported by your browser.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
