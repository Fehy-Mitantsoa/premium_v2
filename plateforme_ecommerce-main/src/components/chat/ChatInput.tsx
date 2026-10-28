/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  loading,
  disabled = false,
}) => {
  const isInputEmpty = !input || !input.trim();
  const isDisabled = loading || disabled || isInputEmpty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    onSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled) {
        onSend();
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
    >
      <div className="relative flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          disabled={loading || disabled}
          maxLength={500}
          aria-label="Votre message au chatbot"
          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-transparent dark:border-slate-700/60 transition-all disabled:opacity-60"
        />
        {input.length > 400 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
            {500 - input.length}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        aria-label="Envoyer le message"
        className={`p-2.5 rounded-xl font-medium transition-all flex items-center justify-center shrink-0 ${
          isDisabled
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-70'
            : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-sm hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  );
};

export default ChatInput;
