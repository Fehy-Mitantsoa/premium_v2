/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import {
  Bot,
  X,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Minus,
  Globe,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import QuickReplies from './QuickReplies';
import useChat from '../../hooks/useChat';
import { useApp } from '../../context/AppContext';

export const ChatBot: React.FC = () => {
  const { user } = useApp();

  const {
    messages,
    loading,
    input,
    setInput,
    isOpen,
    isMinimized,
    isFullScreen,
    unreadCount,
    language,
    quickReplies,
    toggleOpen,
    toggleMinimize,
    toggleFullScreen,
    handleLanguageChange,
    sendMessage,
    retryMessage,
    resetChat,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen, isMinimized]);

  // Handle keyboard Escape key to close or minimize window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullScreen) {
          toggleFullScreen();
        } else {
          toggleOpen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullScreen, toggleFullScreen, toggleOpen]);

  // If user is not logged in / registered, do not render chatbot to save AI tokens
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button with Notification Badge */}
      <div className="fixed bottom-5 right-5 z-50">
        <motion.button
          onClick={toggleOpen}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label={isOpen ? 'Fermer le chatbot support' : 'Ouvrir le chatbot support'}
          aria-expanded={isOpen}
          className="relative w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl shadow-emerald-600/35 dark:shadow-emerald-950/50 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-500/40 border border-emerald-500/40"
        >
          <AnimatePresence mode="wait">
            {isOpen && !isMinimized ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative flex items-center justify-center"
              >
                <MessageSquare className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unread Count Badge */}
          {!isOpen && unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* Minimized Pill Bar */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={toggleMinimize}
            className="fixed bottom-22 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-full shadow-lg border border-emerald-500/40 flex items-center gap-2.5 cursor-pointer hover:bg-emerald-800 transition-all"
          >
            <Bot className="w-4 h-4 text-emerald-200" />
            <span className="text-xs font-semibold">Assistant Chat</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unreadCount}
              </span>
            )}
            <Maximize2 className="w-3.5 h-3.5 text-emerald-200 ml-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Dialog Window */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <>
            {/* Backdrop overlay when full screen */}
            {isFullScreen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleFullScreen}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
              />
            )}

            <motion.div
              ref={chatWindowRef}
              role="dialog"
              aria-label="Assistant virtuel e-commerce"
              aria-modal={isFullScreen}
              initial={{ opacity: 0, y: 25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: 0.95 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`fixed z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden font-sans transition-all duration-300 ${
                isFullScreen
                  ? 'inset-2 sm:inset-6 md:inset-10 lg:inset-16 max-w-5xl mx-auto h-[calc(100vh-1rem)] sm:h-[calc(100vh-3rem)] md:h-[calc(100vh-5rem)]'
                  : 'bottom-22 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[410px] h-[560px] max-h-[82vh]'
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-3.5 sm:px-4 flex items-center justify-between shrink-0 shadow-md select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                      Assistant IA Client
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-400/20 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300/30 font-medium">
                        <Sparkles className="w-2.5 h-2.5" /> En ligne
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-100/90 leading-none mt-0.5">
                      Support & conseils d'achat
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Language Switcher */}
                  <button
                    onClick={() => {
                      const nextLang = language === 'fr' ? 'en' : language === 'en' ? 'mg' : 'fr';
                      handleLanguageChange(nextLang);
                    }}
                    title={`Changer de langue (Actuel: ${language === 'mg' ? 'Malgache' : language.toUpperCase()})`}
                    aria-label={`Changer de langue (Actuel: ${language === 'mg' ? 'Malgache' : language.toUpperCase()})`}
                    className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{language === 'mg' ? 'MG' : language.toUpperCase()}</span>
                  </button>

                  {/* Minimize Button */}
                  <button
                    onClick={toggleMinimize}
                    title="Minimiser la fenêtre"
                    aria-label="Minimiser la fenêtre"
                    className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  {/* Maximize / Fullscreen Button */}
                  <button
                    onClick={toggleFullScreen}
                    title={isFullScreen ? 'Réduire la fenêtre' : 'Plein écran'}
                    aria-label={isFullScreen ? 'Réduire la fenêtre' : 'Plein écran'}
                    className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                  >
                    {isFullScreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>

                  {/* Reset Chat History */}
                  <button
                    onClick={resetChat}
                    title="Réinitialiser la conversation"
                    aria-label="Réinitialiser la conversation"
                    className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Close Window */}
                  <button
                    onClick={toggleOpen}
                    title="Fermer le chat"
                    aria-label="Fermer le chat"
                    className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* User Authentication Status Indicator Bar */}
              <div className="bg-slate-900 dark:bg-slate-950 text-emerald-100 text-[11px] px-3.5 py-1.5 flex items-center justify-between border-b border-slate-700/80 shrink-0 font-medium">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-semibold text-white shrink-0">
                    Statut :
                  </span>
                  <span className="text-emerald-300 dark:text-emerald-400 truncate flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{user.name ? `${user.name} (${user.email})` : user.email}</span>
                  </span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-2 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Connecté
                </span>
              </div>

              {/* Messages Body (Live ARIA region) */}
              <div
                aria-live="polite"
                aria-relevant="additions"
                className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/70 dark:bg-slate-950/50"
              >
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onRetry={retryMessage}
                  />
                ))}

                {/* Typing Indicator */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 my-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-2.5 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700/80 shadow-sm">
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        L'agent est en train d'écrire
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggested Replies */}
              {!loading && quickReplies && quickReplies.length > 0 && (
                <QuickReplies
                  replies={quickReplies}
                  onSelect={(reply) => sendMessage(reply)}
                  disabled={loading}
                />
              )}

              {/* Chat Input Field */}
              <ChatInput
                input={input}
                setInput={setInput}
                onSend={() => sendMessage()}
                loading={loading}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
