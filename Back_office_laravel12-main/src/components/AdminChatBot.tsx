import React, { useState } from "react";
import { Bot, Sparkles, X, MessageSquareText } from "lucide-react";
import ChatWindow from "./admin-ai/ChatWindow";

interface AdminChatBotProps {
  adminId?: string;
}

export const AdminChatBot: React.FC<AdminChatBotProps> = ({ adminId = "ADMIN_ID" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-3.5 rounded-full shadow-xl hover:shadow-blue-500/25 transition-all duration-300 cursor-pointer flex items-center justify-center"
          title="Assistant IA Administrateur"
        >
          {/* Pulsing ring background */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-40 group-hover:opacity-75 blur transition duration-300 animate-pulse"></span>

          <div className="relative flex items-center gap-2">
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <>
                <Bot className="w-6 h-6 text-white" />
                <span className="hidden sm:inline-block text-xs font-bold tracking-wide pr-1">
                  IA Copilote
                </span>
                <span className="relative flex h-2.5 w-2.5 -top-2 -right-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Chat Window Modal */}
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} adminId={adminId} />}
    </>
  );
};

export default AdminChatBot;
