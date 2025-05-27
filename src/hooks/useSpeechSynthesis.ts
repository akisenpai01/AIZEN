// src/hooks/useSpeechSynthesis.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getLocalStorageItem, setLocalStorageItem } from '@/lib/localStorageUtils';

const AIZEN_VOICE_URI_KEY = 'aizen_voice_uri';
const AIZEN_TTS_ENABLED_KEY = 'aizen_tts_enabled';

export interface CustomSpeechSynthesisVoice extends SpeechSynthesisVoice {
  // Add any custom properties if needed, for now it's same as SpeechSynthesisVoice
}

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<CustomSpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      const initialVoiceURI = getLocalStorageItem<string | null>(AIZEN_VOICE_URI_KEY, null);
      setSelectedVoiceURI(initialVoiceURI);
      const initialTtsEnabled = getLocalStorageItem<boolean>(AIZEN_TTS_ENABLED_KEY, true);
      setTtsEnabled(initialTtsEnabled);

      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices() as CustomSpeechSynthesisVoice[];
        setVoices(availableVoices);
        // If a preferred voice exists (e.g. English, female), set it as default
        if (!initialVoiceURI && availableVoices.length > 0) {
          const defaultVoice = availableVoices.find(voice => voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')) || availableVoices[0];
          if (defaultVoice) {
            setSelectedVoiceURI(defaultVoice.voiceURI);
            setLocalStorageItem(AIZEN_VOICE_URI_KEY, defaultVoice.voiceURI);
          }
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel(); // Clean up any ongoing speech
      };
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported || !ttsEnabled || isSpeaking || !text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoiceURI) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [supported, ttsEnabled, selectedVoiceURI, voices, isSpeaking]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  const handleSetSelectedVoiceURI = (voiceURI: string | null) => {
    setSelectedVoiceURI(voiceURI);
    setLocalStorageItem(AIZEN_VOICE_URI_KEY, voiceURI);
  };

  const handleSetTtsEnabled = (enabled: boolean) => {
    setTtsEnabled(enabled);
    setLocalStorageItem(AIZEN_TTS_ENABLED_KEY, enabled);
    if (!enabled) {
      cancel(); // Stop speaking if TTS is disabled
    }
  };

  return {
    supported,
    speak,
    cancel,
    isSpeaking,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI: handleSetSelectedVoiceURI,
    ttsEnabled,
    setTtsEnabled: handleSetTtsEnabled,
  };
}
