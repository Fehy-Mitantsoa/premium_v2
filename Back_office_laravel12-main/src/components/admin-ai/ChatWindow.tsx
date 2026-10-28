import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  X,
  Trash2,
  Sparkles,
  RefreshCw,
  Maximize2,
  Minimize2,
  ShieldAlert
} from "lucide-react";
import {
  ChatMessage,
  getSavedHistory,
  saveHistory,
  clearSavedHistory,
  sendAdminChatMessage
} from "../../services/adminChatService";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

interface ChatWindowProps {
  onClose: () => void;
  adminId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, adminId = "ADMIN_ID" }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = getSavedHistory();
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      // Welcome initial message
      const welcomeMsg: ChatMessage = {
        id: "msg_welcome",
        sender: "ai",
        timestamp: new Date().toISOString(),
        content: "Bonjour Administrateur ! Je suis votre Copilote IA pour le pilotage de la boutique e-commerce. Posez-moi vos questions sur les ventes, les stocks, les clients ou la détection d'anomalies.",
        structuredReply: {
          executiveSummary: "📊 Bonjour ! Je suis prêt à analyser vos ventes, vos stocks, l'activité de vos clients et vos flux Mobile Money.",
          detailedAnalysis: "Grâce à notre intégration directe avec votre base de données e-commerce, je peux générer des graphiques, des alertes de stock et des recommandations stratégiques.",
          recommendations: [
            "Demandez 'Analyse des ventes cette semaine' pour un bilan du chiffre d'affaires.",
            "Consultez 'Produits en rupture de stock' pour réapprovisionner au plus vite.",
            "Consultez 'Analyse des clients' pour observer les tops acheteurs."
          ],
          priorityActions: [
            {
              title: "Lancer un audit rapide des performances de la boutique",
              priority: "HAUTE",
              reason: "Aperçu global recommandé pour débuter la journée."
            }
          ]
        }
      };
      setMessages([welcomeMsg]);
      saveHistory([welcomeMsg]);
    }
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      timestamp: new Date().toISOString(),
      content: text,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveHistory(newMessages);
    setIsLoading(true);

    try {
      const responseData = await sendAdminChatMessage(text, adminId);
      
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        timestamp: new Date().toISOString(),
        content: responseData.reply.fullText || responseData.reply.executiveSummary,
        structuredReply: responseData.reply,
      };

      const updated = [...newMessages, aiMsg];
      setMessages(updated);
      saveHistory(updated);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "ai",
        timestamp: new Date().toISOString(),
        content: `Désolé, une erreur est survenue lors du traitement : ${err.message || "Erreur de connexion"}`,
        error: true,
      };
      const updated = [...newMessages, errorMsg];
      setMessages(updated);
      saveHistory(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Voulez-vous réinitialiser l'historique de la conversation IA ?")) {
      clearSavedHistory();
      setMessages([]);
    }
  };

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 flex flex-col bg-slate-950 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 font-sans ${
        isExpanded
          ? "w-[92vw] md:w-[700px] h-[82vh] max-h-[800px]"
          : "w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh]"
      }`}
    >
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-white tracking-wide">Assistant IA Administrateur</h3>
              <span className="text-[9px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded uppercase">
                Groq / Gemini
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>Pilote intelligent E-Commerce</span>
            </p>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={handleClearChat}
            className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Effacer la conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? "Réduire" : "Agrandir"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fermer le chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 py-1.5 flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
        <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="truncate">L'IA ne modifie jamais la base sans votre confirmation explicite.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/80 no-scrollbar">
        {messages.map((msg, idx) => {
          // Find preceding user prompt if any for PDF export
          const promptMsg = idx > 0 && messages[idx - 1].sender === "user" ? messages[idx - 1].content : undefined;
          return <MessageBubble key={msg.id || idx} message={msg} promptQuestion={promptMsg} />;
        })}

        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};
export default ChatWindow;
