
// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { samuraiAIChat, type SamuraiAIChatInput, type SamuraiAIChatOutput } from "@/ai/flows/samurai-ai-chat";
import { AizenChatWindow } from "@/components/aizen/AizenChatWindow";
import { AizenChatInput } from "@/components/aizen/AizenChatInput";
import type { Message } from "@/components/aizen/AizenChatMessage"; // Message type here will now not include feedback
import { Input } from "@/components/ui/input"; // For Search
import { Button } from "@/components/ui/button"; // For Search
import { Search, XCircle } from "lucide-react"; // For Search
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { v4 as uuidv4 } from 'uuid';
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/localStorageUtils";

const AIZEN_CHAT_HISTORY_KEY = 'aizen_chat_history';
const CHAT_HISTORY_CONTEXT_LENGTH = 10; 
const AIZEN_THEME_KEY = 'aizen_theme_name'; 

export interface Theme {
  name: string;
  bgImage: string;
  dataAiHint: string;
}

const availableThemes: Theme[] = [
  { name: 'Default', bgImage: "https://media-hosting.imagekit.io/7e8c99534f4d4798/wp9226062-4k-samurai-mobile-wallpapers.jpg?Expires=1840948638&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=r62I1Q4W4YHDy7eiAKqwWodbPFzVNXXwioylagBQi16o1rzM9Y6dcqUPdEi3RT-sYxwAiJdHM74NsQs-Uvb4lM7lUKxM9ZzFbZOMaz9rrmV04KHyqrugDwVIQTOC7C95kY90o42Gd1lmMUznk-27FKLdFA1w82wzZFl0NbXnLu6~E2IIDbm391RQqbef8~TLw2rIRWM6BG0Efgjh4T34zIsevcrRGcsj~LoNgNPR12Kuk6VotvanRGnuSwBoMXj7mAnxLPwAafsbgi~rUxv-mWElzAlUD90cerywZme6rtLYp5g9nQB7e-YWpa3poyalPdIrIB9A-0YyoP8pyWKyow__", dataAiHint: 'samurai landscape' },
  { name: 'Serene Garden', bgImage: 'https://placehold.co/1920x1080/A9A9A9/FFFFFF.png?text=Serene+Garden', dataAiHint: 'zen garden' },
  { name: 'Dojo Training', bgImage: 'https://placehold.co/1920x1080/2F4F4F/FFFFFF.png?text=Dojo+Training', dataAiHint: 'dojo interior' },
  { name: 'Moonlit Night', bgImage: 'https://placehold.co/1920x1080/483D8B/FFFFFF.png?text=Moonlit+Night', dataAiHint: 'moon night' },
];


export default function AizenCompanionPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isInitialMount = useRef(true);

  const [selectedThemeName, setSelectedThemeName] = useState<string>(availableThemes[0].name);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);

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

    const storedThemeName = getLocalStorageItem<string | null>(AIZEN_THEME_KEY, availableThemes[0].name);
    setSelectedThemeName(storedThemeName || availableThemes[0].name);
    
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

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDisplayedMessages(messages);
    } else {
      setDisplayedMessages(
        messages.filter(msg =>
          msg.text.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [messages, searchTerm]);

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
      
      // Replace the thinking message with Aizen's actual response using handleUpdateMessage
      handleUpdateMessage(thinkingMessageId, aizenMessage);


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
      // Replace the thinking message with an error message
      handleUpdateMessage(thinkingMessageId, errorMessage);
    } finally {
      setIsLoading(false); 
    }
  }, [inputValue, messages, speak, ttsEnabled, isSpeechSynthesisSupported, toast, handleUpdateMessage]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setLocalStorageItem(AIZEN_CHAT_HISTORY_KEY, []); // Also clear from local storage
    toast({
      title: "Chat Cleared",
      description: "Your conversation with Aizen has been cleared.",
    });
  }, [toast]);

  const handleThemeChange = (themeName: string) => {
    setSelectedThemeName(themeName);
    setLocalStorageItem(AIZEN_THEME_KEY, themeName);
    const selectedTheme = availableThemes.find(t => t.name === themeName);
    if (selectedTheme && typeof window !== 'undefined') {
        const bgElement = document.getElementById('app-background');
        if (bgElement) {
            bgElement.style.backgroundImage = `url('${selectedTheme.bgImage}')`;
            bgElement.setAttribute('data-ai-hint', selectedTheme.dataAiHint);
        }
    }
  };

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      <div className="p-2 border-b border-border/30 bg-background/30 backdrop-blur-sm">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chat history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 bg-input/70 border-border/50 focus:ring-accent/50 placeholder:text-muted-foreground/70"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-accent"
              onClick={() => setSearchTerm("")}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-grow flex flex-col overflow-hidden pt-2">
        {/* Pass handleUpdateMessage to AizenChatWindow */}
        <AizenChatWindow messages={displayedMessages} isLoading={isLoading} onUpdateMessage={handleUpdateMessage} /> 
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
        availableThemes={availableThemes}
        selectedThemeName={selectedThemeName}
        onThemeChange={handleThemeChange}
      />
    </main>
  );
}
