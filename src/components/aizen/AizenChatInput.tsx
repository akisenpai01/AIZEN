// src/components/aizen/AizenChatInput.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { PulsatingMicIcon } from "./PulsatingMicIcon";
import type { FormEvent } from "react";
import type { CustomSpeechSynthesisVoice } from "@/hooks/useSpeechSynthesis";
import { AizenSettings } from "./AizenSettings";

interface AizenChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  isSpeechRecognitionSupported: boolean;
  speechRecognitionError: string | null;
  // TTS Props
  voices: CustomSpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  onVoiceChange: (voiceURI: string | null) => void;
  ttsEnabled: boolean;
  onTtsToggle: (enabled: boolean) => void;
  isSpeechSynthesisSupported: boolean;
}

export function AizenChatInput({
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  isRecording,
  startRecording,
  stopRecording,
  isSpeechRecognitionSupported,
  speechRecognitionError,
  voices,
  selectedVoiceURI,
  onVoiceChange,
  ttsEnabled,
  onTtsToggle,
  isSpeechSynthesisSupported
}: AizenChatInputProps) {
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage();
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="p-4 bg-background/50 backdrop-blur-sm border-t border-border/30 shadow-md">
      <form 
        onSubmit={handleSubmit} 
        className="flex items-center gap-2"
        suppressHydrationWarning={true}
      >
        <Input
          type="text"
          placeholder={isRecording ? "Listening..." : "Speak or type your thoughts..."}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          className="flex-grow bg-input/70 border-border/50 focus:ring-accent/50 placeholder:text-muted-foreground/70"
          disabled={isLoading || isRecording}
        />
        {isSpeechRecognitionSupported && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleMicClick}
            disabled={isLoading}
            className="text-accent hover:bg-accent/20 hover:text-accent"
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <PulsatingMicIcon isListening={isRecording} className="h-5 w-5" />
          </Button>
        )}
        <Button 
          type="submit" 
          size="icon" 
          variant="ghost" 
          disabled={isLoading || !inputValue.trim()}
          className="text-accent hover:bg-accent/20 hover:text-accent"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
        <AizenSettings
          voices={voices}
          selectedVoiceURI={selectedVoiceURI}
          onVoiceChange={onVoiceChange}
          ttsEnabled={ttsEnabled}
          onTtsToggle={onTtsToggle}
          isSpeechSynthesisSupported={isSpeechSynthesisSupported}
        />
      </form>
      {speechRecognitionError && <p className="text-xs text-destructive mt-1">{speechRecognitionError}</p>}
      {!isSpeechRecognitionSupported && <p className="text-xs text-muted-foreground mt-1">Voice input not supported by your browser.</p>}
    </div>
  );
}
