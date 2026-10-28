import React from "react";
import { Sparkles, Bot } from "lucide-react";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-2.5 my-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
        <Bot className="w-4 h-4 animate-pulse" />
      </div>

      <div className="bg-slate-800 border border-slate-700/80 rounded-2xl rounded-tl-none p-3.5 max-w-sm shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-xs font-semibold text-slate-300">
            L'IA analyse les données...
          </span>
          <div className="flex items-center gap-1 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TypingIndicator;
