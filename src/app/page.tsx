// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { samuraiAIChat, type SamuraiAIChatInput, type SamuraiAIChatOutput } from "@/ai/flows/samurai-ai-chat";
import { getDailyWisdom, type GetWisdomInput, type GetWisdomOutput } from "@/ai/flows/get-daily-wisdom";
import { AizenChatWindow } from "@/components/aizen/AizenChatWindow";
import { AizenChatInput } from "@/components/aizen/AizenChatInput";
import { DailyWisdomDisplay } from "@/components/aizen/DailyWisdomDisplay";
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
const CHAT_HISTORY_CONTEXT_LENGTH = 5;

export default function AizenCompanionPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dailyWisdomText, setDailyWisdomText] = useState<string | null>(null);
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
      setDailyWisdomText(storedWisdom);
      return;
    }

    // If forcing refresh or old wisdom, show a temporary loading state for wisdom
    if(forceRefresh) setDailyWisdomText("Aizen is seeking new enlightenment...");


    try {
      const wisdomInput: GetWisdomInput = {};
      const wisdomOutput: GetWisdomOutput = await getDailyWisdom(wisdomInput);
      setDailyWisdomText(wisdomOutput.wisdom);
      setLocalStorageItem(DAILY_WISDOM_KEY, wisdomOutput.wisdom);
      setLocalStorageItem(LAST_WISDOM_FETCH_DATE_KEY, new Date().toISOString());
      if (forceRefresh) { // Only speak if it was a manual refresh action
         if (ttsEnabled && isSpeechSynthesisSupported) {
          speak(wisdomOutput.wisdom);
        }
        toast({ title: "Aizen's Wisdom", description: "A fresh insight has been shared." });
      }
    } catch (error) {
      console.error("Error getting daily wisdom from Aizen:", error);
      const errorMessage = "Aizen's wisdom is elusive at this moment. The scrolls are blank.";
      setDailyWisdomText(errorMessage); // Show error in the wisdom display
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
    fetchAndSetDailyWisdom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch on initial mount

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
        text: "...",
        timestamp: new Date(),
        isLoadingPlaceholder: true,
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const historyForAI = messages
        .filter(msg => !msg.isLoadingPlaceholder) // Exclude previous thinking messages from history
        .slice(-CHAT_HISTORY_CONTEXT_LENGTH)
        .map(msg => ({ sender: msg.sender, text: msg.text }));
      
      const aiInput: SamuraiAIChatInput = { 
        message: currentMessageText,
        history: historyForAI,
      };
      const aiOutput: SamuraiAIChatOutput = await samuraiAIChat(aiInput);
      
      const aizenMessage: Message = {
        id: uuidv4(), // New ID for the actual response
        sender: 'aizen',
        text: aiOutput.response,
        timestamp: new Date(),
        imageUrl: aiOutput.imageUrl,
        imagePrompt: aiOutput.imagePrompt,
      };
      // Replace thinking message with actual response
      setMessages(prev => prev.map(m => m.id === thinkingMessageId ? aizenMessage : m));


      if (ttsEnabled && isSpeechSynthesisSupported) {
        speak(aiOutput.response);
      }

    } catch (error) {
      console.error("Error communicating with Aizen AI:", error);
      const errorText = error instanceof Error && error.message.includes("blocked") 
        ? "Aizen senses a sensitive topic. Perhaps another path of inquiry?"
        : "Aizen is momentarily lost in the echoes of the void. Please try rephrasing.";
      
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
      setIsLoading(false); // This will remove the generic skeleton loader from ChatWindow if it's still active
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
    // This button now primarily serves to refresh the wisdom,
    // or show a loading state if initial fetch is slow.
    // The actual display is handled by DailyWisdomDisplay.
    setIsLoading(true); // General loading state for this action
    await fetchAndSetDailyWisdom(true); // force refresh
    setIsLoading(false);
  }, [fetchAndSetDailyWisdom]);


  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      <DailyWisdomDisplay wisdom={dailyWisdomText} />
      <div className="flex-grow flex flex-col overflow-hidden">
        <AizenChatWindow messages={messages} isLoading={false} onUpdateMessage={handleUpdateMessage} /> 
        {/* isLoading prop to AizenChatWindow might be redundant now if using placeholder messages */}
      </div>
      <AizenChatInput
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={() => handleSendMessage()}
        isLoading={isLoading} // This isLoading is for the input field and send button
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
        onGetWisdom={handleGetWisdomButton} // Renamed for clarity
      />
    </main>
  );
}
