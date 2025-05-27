
// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { samuraiAIChat, type SamuraiAIChatInput, type SamuraiAIChatOutput } from "@/ai/flows/samurai-ai-chat";
import { AizenChatWindow } from "@/components/aizen/AizenChatWindow";
import { AizenChatInput } from "@/components/aizen/AizenChatInput";
import type { Message } from "@/components/aizen/AizenChatMessage";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { v4 as uuidv4 } from 'uuid';
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/localStorageUtils";
import { availableThemes, AIZEN_THEME_KEY } from '@/app/RootLayoutClientBoundary'; // Removed Theme type as it's defined in RootLayoutClientBoundary
import { ChatHistoryModal } from "@/components/aizen/ChatHistoryModal";


const AIZEN_CHAT_HISTORY_KEY = 'aizen_chat_history';
const CHAT_HISTORY_CONTEXT_LENGTH = 10;


export default function AizenCompanionPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isInitialMount = useRef(true);

  const [selectedThemeName, setSelectedThemeName] = useState<string>(availableThemes[0].name);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);


  const {
    isListening: isRecording,
    transcript: voiceTranscript,
    startListening,
    stopListening,
    error: speechRecognitionError,
    supported: isSpeechRecognitionSupported,
    setTranscript: setVoiceTranscript,
  } = useSpeechRecognition();

  const {
    speak,
    supported: isSpeechSynthesisSupported,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    ttsEnabled,
    setTtsEnabled,
  } = useSpeechSynthesis();

  useEffect(() => {
    const storedMessages = getLocalStorageItem<Message[] | null>(AIZEN_CHAT_HISTORY_KEY, null);
    if (storedMessages) {
      const parsedMessages = storedMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));
      setMessages(parsedMessages);
    }

    const storedThemeName = getLocalStorageItem<string | null>(AIZEN_THEME_KEY, null);
    if (storedThemeName && availableThemes.some(t => t.name === storedThemeName)) {
      setSelectedThemeName(storedThemeName);
    } else {
      setSelectedThemeName(availableThemes[0].name);
    }

    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) {
      setLocalStorageItem(AIZEN_CHAT_HISTORY_KEY, messages);
    }
  }, [messages]);

  useEffect(() => {
    if (voiceTranscript) {
      setInputValue(voiceTranscript);
    }
  }, [voiceTranscript]);

  useEffect(() => {
    if (!isRecording && voiceTranscript.trim() !== "") {
      handleSendMessage(voiceTranscript);
      setVoiceTranscript("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);


  const handleUpdateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const currentMessageText = (textToSend || inputValue).trim();
    if (!currentMessageText) return;

    const userMessage: Message = {
      id: uuidv4(),
      sender: 'user',
      text: currentMessageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const thinkingMessageId = uuidv4();
    const thinkingMessage: Message = {
        id: thinkingMessageId,
        sender: 'aizen',
        text: "...",
        timestamp: new Date(),
        isLoadingPlaceholder: true,
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const historyForAI = messages
        .filter(msg => !msg.isLoadingPlaceholder)
        .slice(-CHAT_HISTORY_CONTEXT_LENGTH)
        .map(msg => ({ sender: msg.sender as 'user' | 'aizen', text: msg.text }));

      const aiInput: SamuraiAIChatInput = {
        message: currentMessageText,
        history: historyForAI,
      };
      const aiOutput: SamuraiAIChatOutput = await samuraiAIChat(aiInput);

      const aizenMessage: Message = {
        id: uuidv4(),
        sender: 'aizen',
        text: aiOutput.response,
        timestamp: new Date(),
        imageUrl: aiOutput.imageUrl || undefined,
        imagePrompt: aiOutput.imagePrompt || undefined,
      };

      handleUpdateMessage(thinkingMessageId, aizenMessage);


      if (ttsEnabled && isSpeechSynthesisSupported && aiOutput.response) {
        speak(aiOutput.response);
      }

    } catch (error) {
      console.error("Error communicating with Aizen AI:", error);
      let errorText = "Aizen is momentarily lost in the echoes of the void. Please try rephrasing.";
       if (error instanceof Error) {
        if (error.message.toLowerCase().includes("blocked")) {
          errorText = "Aizen senses a sensitive topic. Perhaps another path of inquiry?";
        } else if (error.message.toLowerCase().includes("service unavailable") || error.message.toLowerCase().includes("overloaded") || error.message.includes("503")) {
          errorText = "Aizen's mind is currently overwhelmed by many thoughts. Please try again in a few moments.";
        } else if (error.message.includes("Aizen's artistic vision is clouded") || error.message.includes("Aizen's muse is silent")) {
            errorText = error.message;
        } else if (error.message.includes("unreadable") || error.message.includes("elusive")) {
            errorText = error.message;
        }
      }

      toast({
        title: "Aizen's Contemplation",
        description: errorText,
        variant: "destructive",
      });
       const errorMessage: Message = {
        id: uuidv4(),
        sender: 'aizen',
        text: errorText,
        timestamp: new Date(),
      };
      handleUpdateMessage(thinkingMessageId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, messages, speak, ttsEnabled, isSpeechSynthesisSupported, toast, handleUpdateMessage]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setLocalStorageItem(AIZEN_CHAT_HISTORY_KEY, []);
    toast({
      title: "Chat Cleared",
      description: "Your conversation with Aizen has been cleared.",
    });
  }, [toast]);

  const handleThemeChange = (themeName: string) => {
    const newSelectedTheme = availableThemes.find(t => t.name === themeName) || availableThemes[0];
    setSelectedThemeName(newSelectedTheme.name);
    setLocalStorageItem(AIZEN_THEME_KEY, newSelectedTheme.name);

    if (typeof window !== 'undefined') {
        const event = new StorageEvent('storage', {
          key: AIZEN_THEME_KEY,
          newValue: newSelectedTheme.name,
          oldValue: getLocalStorageItem<string | null>(AIZEN_THEME_KEY, null),
          storageArea: localStorage,
        });
        window.dispatchEvent(event);
    }
  };

  const handleToggleHistoryModal = () => {
    setIsHistoryModalOpen(prev => !prev);
  };

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Search bar removed from here */}
      <div className="flex-grow flex flex-col overflow-hidden pt-2">
        <AizenChatWindow messages={messages} isLoading={isLoading} onUpdateMessage={handleUpdateMessage} />
      </div>
      <AizenChatInput
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={() => handleSendMessage()}
        isLoading={isLoading}
        isRecording={isRecording}
        startRecording={startListening}
        stopRecording={stopListening}
        isSpeechRecognitionSupported={isSpeechRecognitionSupported}
        speechRecognitionError={speechRecognitionError}
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        onVoiceChange={setSelectedVoiceURI}
        ttsEnabled={ttsEnabled}
        onTtsToggle={setTtsEnabled}
        isSpeechSynthesisSupported={isSpeechSynthesisSupported}
        onClearChat={handleClearChat}
        onViewHistory={handleToggleHistoryModal} // New prop
        availableThemes={availableThemes}
        selectedThemeName={selectedThemeName}
        onThemeChange={handleThemeChange}
      />
      <ChatHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleToggleHistoryModal}
        messages={messages}
      />
    </main>
  );
}
