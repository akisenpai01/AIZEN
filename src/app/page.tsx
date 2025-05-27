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

const AIZEN_CHAT_HISTORY_KEY = 'aizen_chat_history';
const CHAT_HISTORY_CONTEXT_LENGTH = 5; // Number of previous messages to send for context

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

  // Load chat history from local storage on initial mount
  useEffect(() => {
    const storedMessages = getLocalStorageItem<Message[] | null>(AIZEN_CHAT_HISTORY_KEY, null);
    if (storedMessages) {
      // Dates are stored as strings, convert them back to Date objects
      const parsedMessages = storedMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));
      setMessages(parsedMessages);
    }
    isInitialMount.current = false; // Mark initial mount as complete
  }, []);

  // Save chat history to local storage whenever messages change (except on initial mount from empty)
  useEffect(() => {
    if (!isInitialMount.current && messages.length > 0) {
       setLocalStorageItem(AIZEN_CHAT_HISTORY_KEY, messages);
    } else if (!isInitialMount.current && messages.length === 0) {
        // If messages are cleared, clear local storage too
        setLocalStorageItem(AIZEN_CHAT_HISTORY_KEY, []);
    }
  }, [messages]);


  // Update input field with voice transcript
  useEffect(() => {
    if (voiceTranscript) {
      setInputValue(voiceTranscript);
    }
  }, [voiceTranscript]);
  
  // Automatically send message when recording stops and there's a transcript
  useEffect(() => {
    if (!isRecording && voiceTranscript.trim() !== "") {
      handleSendMessage(voiceTranscript);
      setVoiceTranscript(""); // Clear transcript after sending
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

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

    try {
      const historyForAI = messages
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
      };
      setMessages(prev => [...prev, aizenMessage]);

      if (ttsEnabled && isSpeechSynthesisSupported) {
        speak(aiOutput.response);
      }

    } catch (error) {
      console.error("Error communicating with Aizen AI:", error);
      toast({
        title: "Error",
        description: "Aizen is contemplating... (Failed to get response). Please try again.",
        variant: "destructive",
      });
       const errorMessage: Message = {
        id: uuidv4(),
        sender: 'aizen',
        text: "Forgive my silence, a momentary disturbance in the ether. Please try rephrasing.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, messages, speak, ttsEnabled, isSpeechSynthesisSupported, toast]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    // Local storage will be cleared by the useEffect listening to messages
    toast({
      title: "Chat Cleared",
      description: "Your conversation with Aizen has been cleared.",
    });
  }, [toast]);

  const handleGetWisdom = useCallback(async () => {
    setIsLoading(true);
    const thinkingMessage: Message = {
      id: uuidv4(),
      sender: 'aizen', // Placeholder, looks like Aizen is typing
      text: "...", // Indicate loading or thinking
      timestamp: new Date(),
      isLoadingPlaceholder: true, // Special flag for temporary message
    };
    // Add a temporary "Aizen is thinking..." message
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const wisdomInput: GetWisdomInput = {}; // Empty input for now
      const wisdomOutput: GetWisdomOutput = await getDailyWisdom(wisdomInput);
      
      const wisdomMessage: Message = {
        id: uuidv4(),
        sender: 'aizen',
        text: wisdomOutput.wisdom,
        timestamp: new Date(),
      };
      // Replace the thinking message with the actual wisdom
      setMessages(prev => [...prev.filter(m => !m.isLoadingPlaceholder), wisdomMessage]);


      if (ttsEnabled && isSpeechSynthesisSupported) {
        speak(wisdomOutput.wisdom);
      }

    } catch (error) {
      console.error("Error getting wisdom from Aizen:", error);
      toast({
        title: "Error",
        description: "Aizen's wisdom is elusive at this moment. Please try again.",
        variant: "destructive",
      });
      // Remove the thinking message if an error occurs
      setMessages(prev => prev.filter(m => !m.isLoadingPlaceholder));
       const errorMessage: Message = {
        id: uuidv4(),
        sender: 'aizen',
        text: "My apologies, the path to wisdom is currently obscured.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [speak, ttsEnabled, isSpeechSynthesisSupported, toast]);


  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      <div className="flex-grow flex flex-col overflow-hidden">
        <AizenChatWindow messages={messages} isLoading={isLoading} />
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
        onGetWisdom={handleGetWisdom}
      />
    </main>
  );
}
