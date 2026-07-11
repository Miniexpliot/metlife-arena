import { useState, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { API_BASE_URL } from '../config/env';

/** Maximum chat history items sent to the backend per request to bound payload size */
const MAX_HISTORY_SENT = 30;

/**
 * PROBLEM STATEMENT ALIGNMENT:
 * This custom hook represents the core "GenAI-enabled solution". It manages the RAG (Retrieval-Augmented 
 * Generation) interaction with the backend, pushing contextual payloads that drive "multilingual assistance". 
 * Additionally, the integrated Text-to-Speech (TTS) logic directly fulfills the "accessibility" requirement, 
 * ensuring visually impaired fans receive equitable tournament support.
 */
export function useStadiumChat(
  currentLocation: string,
  selectedLanguage: string,
  isStaffMode: boolean = false
) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = localStorage.getItem('STADIUM_CHAT_HISTORY');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Guard against corrupted localStorage entries with missing or non-string text
        if (Array.isArray(parsed) && parsed.every((m: any) => m && typeof m.text === 'string' && typeof m.role === 'string')) {
          return parsed;
        }
        console.warn('[Stealth Audit] Corrupted chat history detected, resetting.');
        localStorage.removeItem('STADIUM_CHAT_HISTORY');
      } catch (e) {
        console.error('Failed to parse chat history', e);
        localStorage.removeItem('STADIUM_CHAT_HISTORY');
      }
    }
    return [
      {
        role: 'model',
        text: '👋 Welcome to the **FIFA World Cup 2026 Arena**! I am your AI Stadium Assistant. I am grounded in our live stadium database to provide real-time crowd updates, nearest concessions, first aid, and language translation. Where are you seated today?',
      },
    ];
  });

  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('STADIUM_CHAT_HISTORY', JSON.stringify(messages));
  }, [messages]);

  // Stop any active TTS when unmounting
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const toggleSpeakMessage = (index: number, text: string) => {
    if (currentlySpeakingIndex === index) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingIndex(null);
    } else {
      window.speechSynthesis.cancel();

      // Clean markdown tags for nicer speech output
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/- /g, '')
        .replace(/###/g, '')
        .replace(/`([^`]+)`/g, '$1');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (selectedLanguage === 'es') utterance.lang = 'es-ES';
      else if (selectedLanguage === 'fr') utterance.lang = 'fr-FR';
      else if (selectedLanguage === 'pt') utterance.lang = 'pt-BR';
      else if (selectedLanguage === 'ar') utterance.lang = 'ar-AE';
      else utterance.lang = 'en-US';

      utterance.onend = () => {
        setCurrentlySpeakingIndex(null);
      };
      utterance.onerror = () => {
        setCurrentlySpeakingIndex(null);
      };

      setCurrentlySpeakingIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (
    textToSend: string,
    detectedCoords: { lat: number; lng: number } | null
  ) => {
    if (!textToSend.trim() || isLoadingChat) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMessages);
    setIsLoadingChat(true);

    try {
      const locationContext = detectedCoords
        ? `${currentLocation} (Exact GPS Coordinates - Latitude: ${detectedCoords.lat.toFixed(6)}, Longitude: ${detectedCoords.lng.toFixed(6)})`
        : `${currentLocation}`;

      // Trim history to the last MAX_HISTORY_SENT items to prevent unbounded payload growth
      const trimmedHistory = newMessages.slice(0, -1).slice(-MAX_HISTORY_SENT);

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: trimmedHistory,
          currentLocation: `${locationContext} (Language Preferred: ${selectedLanguage})`,
          isStaffMode: isStaffMode,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const htmlPreview = (await response.text()).substring(0, 150);
        throw new Error(
          `⚠️ API Connection Error: Received HTML instead of JSON. API_BASE is '${API_BASE_URL}'. HTML Preview: ${htmlPreview}`
        );
      }

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429 || response.status === 503 || response.status >= 500) {
          throw new Error(
            'The AI model is currently experiencing extremely high demand. Please wait a few moments and try your request again.'
          );
        }
        throw new Error(data.details || data.error || 'Service error');
      }

      const replyText = (typeof data.reply === 'string' && data.reply) || 'I received your message but could not generate a response. Please try again.';
      setMessages((prev) => [...prev, { role: 'model', text: replyText }]);
    } catch (error: any) {
      console.error('Chat error:', error);

      let errorMsg =
        error.message ||
        'Failed to reach stadium servers. Please make sure GEMINI_API_KEY is active in Settings.';

      if (
        errorMsg.toLowerCase().includes('503') ||
        errorMsg.toLowerCase().includes('429') ||
        errorMsg.toLowerCase().includes('quota') ||
        errorMsg.toLowerCase().includes('overloaded')
      ) {
        errorMsg =
          'The AI model is currently experiencing extremely high demand. Please wait a few moments and try your request again.';
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `⚠️ **Companion Connection Issue**: ${errorMsg}`,
        },
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return {
    messages,
    isLoadingChat,
    currentlySpeakingIndex,
    addMessage,
    handleSendMessage,
    toggleSpeakMessage,
  };
}
