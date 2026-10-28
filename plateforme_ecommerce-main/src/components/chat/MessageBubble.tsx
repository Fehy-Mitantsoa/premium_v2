/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bot, User, AlertCircle, ThumbsUp, ThumbsDown, Headset, RefreshCw, Mail, MessageSquareText } from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, submitFeedback } from '../../services/chatService';
import ProductCard from './ProductCard';
import ComparisonCards from './ComparisonCards';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const isUser = message.sender === 'user';
  const isError = message.isError;
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(message.feedback || null);
  const [showContactModal, setShowContactModal] = useState(false);

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (feedback === type) return;
    setFeedback(type);
    await submitFeedback(message.id, type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 my-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm text-xs"
        >
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[88%] sm:max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
            isUser
              ? 'bg-emerald-600 text-white rounded-br-none'
              : isError
              ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded-bl-none'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none'
          }`}
        >
          {isError && (
            <div className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400 mb-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Erreur de communication</span>
            </div>
          )}

          {/* Markdown formatting with remarkGfm for bot replies / plain text for user */}
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          ) : (
            <div className="prose prose-xs dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-emerald-700 dark:prose-strong:text-emerald-300 overflow-x-auto prose-table:w-full prose-table:border-collapse prose-table:my-2 prose-th:bg-emerald-50 dark:prose-th:bg-slate-800 prose-th:text-emerald-900 dark:prose-th:text-emerald-200 prose-th:p-2 prose-th:text-left prose-td:p-2 prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-700 prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700 text-xs">
              <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
            </div>
          )}

          {/* Split-view comparison cards if 2+ products attached */}
          {message.products && message.products.length >= 2 ? (
            <ComparisonCards products={message.products} />
          ) : message.products && message.products.length === 1 ? (
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Produit recommandé :
              </p>
              <ProductCard product={message.products[0] as any} />
            </div>
          ) : null}

          {/* Human Escalation Banner */}
          {message.escalateToHuman && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 mb-1">
                <Headset className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Transférer à un conseiller humain</span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2">
                Votre demande nécessite l'intervention d'un agent du service client. Vous pouvez nous contacter directement :
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="mailto:support@electrostore.mg?subject=Demande%20Assistance"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-medium transition-colors"
                >
                  <Mail className="w-3 h-3" /> Envoyer un email
                </a>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-100 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <MessageSquareText className="w-3 h-3" /> Ouvrir un ticket
                </button>
              </div>
            </div>
          )}

          {/* Retry Button for errors */}
          {isError && onRetry && (
            <button
              onClick={() => onRetry(message.text)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 animate-spin-hover" /> Réessayer
            </button>
          )}

          <div
            className={`text-[10px] mt-1 text-right select-none ${
              isUser ? 'text-emerald-100/80' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {formattedTime}
          </div>
        </div>

        {/* Feedback 👍 / 👎 for Bot Messages */}
        {!isUser && !isError && (
          <div className="flex items-center gap-1.5 mt-1 px-1 text-[11px] text-slate-400">
            <span className="text-[10px]">Utile ?</span>
            <button
              onClick={() => handleFeedback('like')}
              title="Réponse utile"
              aria-label="Réponse utile"
              className={`p-1 rounded-md transition-all cursor-pointer ${
                feedback === 'like'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleFeedback('dislike')}
              title="Réponse peu claire"
              aria-label="Réponse peu claire"
              className={`p-1 rounded-md transition-all cursor-pointer ${
                feedback === 'dislike'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600'
              }`}
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
            {feedback && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 animate-fade-in">
                Merci !
              </span>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 text-xs shadow-sm"
        >
          <User className="w-4 h-4" />
        </div>
      )}

      {/* Ticket Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
              Contacter le support client
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Un agent vous recontactera sous 24h par email ou téléphone.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Sujet de votre demande
                </label>
                <input
                  type="text"
                  defaultValue="Assistance suite à la conversation avec le bot"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Votre message
                </label>
                <textarea
                  rows={3}
                  defaultValue={message.text}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert('Votre demande a bien été envoyée au support client !');
                  setShowContactModal(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg cursor-pointer"
              >
                Envoyer le ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
