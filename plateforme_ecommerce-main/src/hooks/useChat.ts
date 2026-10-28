/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { detectLanguage } from '../utils/languageDetector';
import {
  sendChatMessage,
  fetchChatHistory,
  resetChatHistory,
  ChatMessage,
} from '../services/chatService';
import { useApp } from '../context/AppContext';

const DEFAULT_QUICK_REPLIES_BY_LANG = {
  fr: [
    '💻 Quels ordinateurs sont disponibles ?',
    '📊 Comparer des ordinateurs',
    '📦 Ma dernière commande',
    '💳 Statut du dernier paiement',
    '🚚 Quels sont les délais de livraison ?',
    '🔄 Quelle est la politique de retour ?',
  ],
  en: [
    '💻 Which laptops are available?',
    '📊 Compare laptops',
    '📦 My last order',
    '💳 Last payment status',
    '🚚 What are the delivery times?',
    '🔄 What is the return policy?',
  ],
  mg: [
    '💻 Inona avy ny solosaina misy ?',
    '📊 Mampitaha solosaina',
    '📦 Ny kaomandiko farany',
    '💳 Fandoavam-bola farany',
    '🚚 Hafiriana ny fotoana fandefasana ?',
    '🔄 Ahoana ny fiverenan\'ny entana ?',
  ],
};

const WELCOME_MESSAGES = {
  fr: "Bonjour ! 👋 Je suis l'assistant virtuel de ElectroStore. Comment puis-je vous aider aujourd'hui ?\n\nVous pouvez me poser des questions sur nos produits, suivre une commande, ou consulter nos politiques de livraison et retour.",
  en: "Hello! 👋 I am ElectroStore's AI assistant. How can I help you today?\n\nFeel free to ask about our products, order tracking, or delivery policies.",
  mg: "Salama! 👋 Izaho no mpanampy virtoaly an'i ElectroStore. Ahoana no azoko anampiana anao androany?\n\nAzonao atao ny manontany momba ny entana misy, manaraka kaomandy, na momba ny fandefasana entana.",
};

export function useChat() {
  const { user } = useApp();

  // Generate or retrieve persistent Session ID
  const [sessionId] = useState<string>(() => {
    let id = localStorage.getItem('chat_session_id');
    if (!id) {
      id = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('chat_session_id', id);
    }
    return id;
  });

  const [language, setLanguage] = useState<'fr' | 'en' | 'mg'>('fr');
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    return localStorage.getItem('chat_is_open') === 'true';
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>(DEFAULT_QUICK_REPLIES_BY_LANG.fr);

  const initialWelcomeMsg: ChatMessage = {
    id: 'welcome-1',
    text: WELCOME_MESSAGES[language],
    sender: 'bot',
    timestamp: new Date(),
    quickReplies: DEFAULT_QUICK_REPLIES_BY_LANG[language],
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(`chat_messages_${sessionId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }
    } catch (e) {
      console.warn('Failed to load local chat messages:', e);
    }
    return [initialWelcomeMsg];
  });

  // Save isOpen state
  useEffect(() => {
    localStorage.setItem('chat_is_open', String(isOpen));
    if (isOpen) {
      setUnreadCount(0);
      setIsMinimized(false);
    }
  }, [isOpen]);

  // Persist messages in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist chat messages:', e);
    }
  }, [messages, sessionId]);

  // Fetch remote chat history on mount if user is logged in
  useEffect(() => {
    if (user?.id) {
      fetchChatHistory(user.id, sessionId).then((remoteHistory) => {
        if (remoteHistory && remoteHistory.length > 0) {
          setMessages(remoteHistory);
        }
      });
    }
  }, [user?.id, sessionId]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  const handleLanguageChange = useCallback((newLang: 'fr' | 'en' | 'mg') => {
    setLanguage(newLang);
    setQuickReplies(DEFAULT_QUICK_REPLIES_BY_LANG[newLang]);
  }, []);

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || input).trim();
      if (!text || loading) return;

      setError(null);
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        text,
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      // Build conversation history format for LLM
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));

      // Detect client language automatically
      const clientDetectedLang = detectLanguage(text);

      try {
        const res = await sendChatMessage(
          text,
          user?.id,
          sessionId,
          historyPayload,
          clientDetectedLang,
          user?.email
        );

        if (res.language && (res.language === 'fr' || res.language === 'en' || res.language === 'mg')) {
          setLanguage(res.language as 'fr' | 'en' | 'mg');
        } else {
          setLanguage(clientDetectedLang);
        }

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          text: res.reply,
          sender: 'bot',
          timestamp: new Date(),
          type: res.type,
          isComparison: res.type === 'comparison',
          products: res.products,
          quickReplies: res.quickReplies,
          escalateToHuman: res.escalateToHuman,
        };

        setMessages((prev) => [...prev, botMsg]);

        if (res.quickReplies && res.quickReplies.length > 0) {
          setQuickReplies(res.quickReplies);
        }

        // Increment unread count if chat window is closed or minimized
        if (!isOpen || isMinimized) {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (err: any) {
        const errMsgText = err?.message || 'Erreur réseau. Impossible d\'envoyer le message.';
        setError(errMsgText);

        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          text: errMsgText,
          sender: 'bot',
          timestamp: new Date(),
          isError: true,
        };

        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, isOpen, isMinimized, user?.id, sessionId]
  );

  const retryMessage = useCallback(
    (failedText: string) => {
      sendMessage(failedText);
    },
    [sendMessage]
  );

  const resetChat = useCallback(async () => {
    await resetChatHistory(user?.id, sessionId);
    setMessages([{
      id: `welcome-${Date.now()}`,
      text: WELCOME_MESSAGES[language],
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: DEFAULT_QUICK_REPLIES_BY_LANG[language],
    }]);
    setQuickReplies(DEFAULT_QUICK_REPLIES_BY_LANG[language]);
    setError(null);
    setUnreadCount(0);
  }, [user?.id, sessionId, language]);

  return {
    messages,
    loading,
    error,
    input,
    setInput,
    isOpen,
    isMinimized,
    isFullScreen,
    unreadCount,
    sessionId,
    language,
    quickReplies,
    toggleOpen,
    toggleMinimize,
    toggleFullScreen,
    handleLanguageChange,
    sendMessage,
    retryMessage,
    resetChat,
  };
}

export default useChat;
