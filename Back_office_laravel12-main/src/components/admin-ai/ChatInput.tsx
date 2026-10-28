import React, { useState } from "react";
import { Send, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  "📊 Analyse des ventes cette semaine",
  "📦 Produits en rupture de stock",
  "🚚 Statut des commandes & livraisons",
  "👤 Analyse des clients & fidélité",
  "💳 Paiements Mobile Money à valider",
  "🔮 Prévisions de ventes",
  "⚠️ Détection de fraude & anomalies"
];

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (isLoading) return;
    onSendMessage(suggestion);
  };

  return (
    <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2.5 font-sans">
      {/* Horizontal scrolling chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[10px]">
        {SUGGESTIONS.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSelectSuggestion(sug)}
            disabled={isLoading}
            className="shrink-0 bg-slate-800 hover:bg-blue-900/60 text-slate-300 hover:text-blue-200 border border-slate-700 hover:border-blue-700/80 rounded-full px-2.5 py-1 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-blue-400 shrink-0" />
            <span>{sug}</span>
          </button>
        ))}
      </div>

      {/* Main input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question sur les ventes, stocks, clients, rapports..."
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
          title="Envoyer le message (Entrée)"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
export default ChatInput;
