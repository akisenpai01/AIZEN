
// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { samuraiAIChat, type SamuraiAIChatInput, type SamuraiAIChatOutput } from "@/ai/flows/samurai-ai-chat";
import { getDailyWisdom, type GetWisdomInput, type GetWisdomOutput } from "@/ai/flows/get-daily-wisdom";
import { AizenChatWindow } from "@/components/aizen/AizenChatWindow";
import { AizenChatInput } from "@/components/aizen/AizenChatInput";
import type { Message } from "@/components/aizen/AizenChatMessage";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { v4 as uuidv4 } from 'uuid';
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/localStorageUtils";
import { isToday, parseISO } from 'date-fns';


const AIZEN_CHAT_HISTORY_KEY = 'aizen_chat_history';
const DAILY_WISDOM_KEY = 'aizen_daily_wisdom';
const LAST_WISDOM_FETCH_DATE_KEY = 'aizen_last_wisdom_fetch_date';
const CHAT_HISTORY_CONTEXT_LENGTH = 5; // Keep 5 messages for AI context

export default function AizenCompanionPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isInitialMount = useRef(true);


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

  const fetchAndSetDailyWisdom = useCallback(async (forceRefresh: boolean = false) => {
    const lastFetchDateStr = getLocalStorageItem<string | null>(LAST_WISDOM_FETCH_DATE_KEY, null);
    const storedWisdom = getLocalStorageItem<string | null>(DAILY_WISDOM_KEY, null);

    if (storedWisdom && lastFetchDateStr && isToday(parseISO(lastFetchDateStr)) && !forceRefresh) {
      return; 
    }

    try {
      const wisdomInput: GetWisdomInput = {};
      const wisdomOutput: GetWisdomOutput = await getDailyWisdom(wisdomInput);
      
      setLocalStorageItem(DAILY_WISDOM_KEY, wisdomOutput.wisdom);
      setLocalStorageItem(LAST_WISDOM_FETCH_DATE_KEY, new Date().toISOString());

      if (forceRefresh) { 
         if (ttsEnabled && isSpeechSynthesisSupported) {
          speak(wisdomOutput.wisdom);
        }
        toast({ title: "Aizen's Wisdom", description: wisdomOutput.wisdom });
      }
    } catch (error) {
      console.error("Error getting daily wisdom from Aizen:", error);
      let errorMessage = "Aizen's wisdom is elusive at this moment. The scrolls are blank.";
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes("service unavailable") || error.message.toLowerCase().includes("overloaded") || error.message.includes("503")) {
          errorMessage = "Aizen's mind is currently overwhelmed. Please try again in a few moments for wisdom.";
        }
      }
      if (forceRefresh) {
        toast({
          title: "Wisdom Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  }, [toast, ttsEnabled, isSpeechSynthesisSupported, speak]);

  useEffect(() => {
    fetchAndSetDailyWisdom(false); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const storedMessages = getLocalStorageItem<Message[] | null>(AIZEN_CHAT_HISTORY_KEY, null);
    if (storedMessages) {
      const parsedMessages = storedMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));
      setMessages(parsedMessages);
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
        text: "...", // Standard "thinking" text
        timestamp: new Date(),
        isLoadingPlaceholder: true,
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const historyForAI = messages
        .filter(msg => !msg.isLoadingPlaceholder) 
        .slice(-CHAT_HISTORY_CONTEXT_LENGTH)
        .map(msg => ({ sender: msg.sender, text: msg.text }));
      
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
        imageUrl: aiOutput.imageUrl,
        imagePrompt: aiOutput.imagePrompt,
      };
      
      setMessages(prev => prev.map(m => m.id === thinkingMessageId ? aizenMessage : m));


      if (ttsEnabled && isSpeechSynthesisSupported) {
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
        } else if (error.message.includes("Aizen's artistic vision is clouded")) { 
            errorText = error.message; // Use the specific error from image generation
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
      setMessages(prev => prev.map(m => m.id === thinkingMessageId ? errorMessage : m));
    } finally {
      setIsLoading(false); 
    }
  }, [inputValue, messages, speak, ttsEnabled, isSpeechSynthesisSupported, toast]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "Your conversation with Aizen has been cleared.",
    });
  }, [toast]);

  const handleGetWisdomButton = useCallback(async () => {
    setIsLoading(true); 
    await fetchAndSetDailyWisdom(true); 
    setIsLoading(false);
  }, [fetchAndSetDailyWisdom]);


  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
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
        onGetWisdom={handleGetWisdomButton}
      />
    </main>
  );
}

