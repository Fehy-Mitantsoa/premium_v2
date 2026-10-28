import React, { useState } from "react";
import {
  Bot,
  User,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart2,
  AlertCircle
} from "lucide-react";
import { ChatMessage, exportReportPDF } from "../../services/adminChatService";
import StatisticCard from "./StatisticCard";
import ChartRenderer from "./ChartRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
  promptQuestion?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, promptQuestion }) => {
  const [copied, setCopied] = useState(false);
  const isAI = message.sender === "ai";

  const handleCopy = () => {
    const textToCopy = message.structuredReply
      ? message.structuredReply.fullText ||
        `${message.structuredReply.executiveSummary}\n\n${message.structuredReply.detailedAnalysis}`
      : message.content;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (message.structuredReply) {
      exportReportPDF(message.structuredReply, promptQuestion || "Analyse IA E-Commerce");
    }
  };

  if (!isAI) {
    return (
      <div className="flex justify-end my-3 font-sans">
        <div className="flex items-start gap-2.5 max-w-[85%] flex-row-reverse">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm text-xs leading-relaxed font-medium">
            <p className="whitespace-pre-wrap">{message.content}</p>
            <span className="text-[9px] text-blue-200 mt-1 block text-right">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const reply = message.structuredReply;

  return (
    <div className="flex justify-start my-3.5 font-sans">
      <div className="flex items-start gap-2.5 max-w-[92%]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md border border-slate-700">
          <Bot className="w-4 h-4" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-slate-200 shadow-md space-y-3.5 text-xs">
          {message.error ? (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-950/40 border border-rose-900/50 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{message.content}</span>
            </div>
          ) : reply ? (
            <>
              {/* 📊 Résumé exécutif */}
              {reply.executiveSummary && (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-blue-400 font-extrabold uppercase tracking-wider text-[11px] mb-1">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>📊 Résumé exécutif</span>
                  </div>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    {reply.executiveSummary.replace(/^📊\s*/, "")}
                  </p>
                </div>
              )}

              {/* KPIs Grid */}
              {reply.kpis && reply.kpis.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 my-2">
                  {reply.kpis.map((kpi, idx) => (
                    <StatisticCard key={idx} kpi={kpi} />
                  ))}
                </div>
              )}

              {/* Recharts Chart */}
              {reply.chart && <ChartRenderer chart={reply.chart} />}

              {/* 📈 Analyse détaillée */}
              {reply.detailedAnalysis && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📈 Analyse détaillée</span>
                  </h4>
                  <div className="text-slate-300 leading-relaxed space-y-1 whitespace-pre-wrap pl-1 border-l-2 border-indigo-500/40">
                    {reply.detailedAnalysis.replace(/^📈\s*/, "")}
                  </div>
                </div>
              )}

              {/* ⚠️ Problèmes détectés */}
              {reply.detectedProblems && reply.detectedProblems.length > 0 && (
                <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-3 space-y-1.5">
                  <h4 className="text-[11px] font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>⚠️ Problèmes détectés</span>
                  </h4>
                  <ul className="space-y-1 text-rose-200/90 pl-1">
                    {reply.detectedProblems.map((prob, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{prob.replace(/^⚠️\s*/, "")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 💡 Recommandations */}
              {reply.recommendations && reply.recommendations.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-900/40 rounded-xl p-3 space-y-1.5">
                  <h4 className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>💡 Recommandations</span>
                  </h4>
                  <ul className="space-y-1 text-amber-200/90 pl-1">
                    {reply.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">➔</span>
                        <span>{rec.replace(/^💡\s*/, "")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 🎯 Actions prioritaires */}
              {reply.priorityActions && reply.priorityActions.length > 0 && (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 space-y-2">
                  <h4 className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>🎯 Actions prioritaires</span>
                  </h4>
                  <div className="space-y-1.5">
                    {reply.priorityActions.map((act, i) => {
                      const isHigh = act.priority === "HAUTE";
                      const isMed = act.priority === "MOYENNE";
                      return (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-700/50"
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-100">{act.title}</p>
                            {act.reason && (
                              <p className="text-[10px] text-slate-400">{act.reason}</p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isHigh
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : isMed
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {act.priority}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="whitespace-pre-wrap text-slate-200">{message.content}</p>
          )}

          {/* Action footer for AI bubble */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                title="Copier le texte"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copié !" : "Copier"}</span>
              </button>

              {reply && (
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1 hover:text-blue-300 text-blue-400 px-2 py-1 rounded bg-blue-950/60 border border-blue-900 transition-colors cursor-pointer"
                  title="Exporter ce rapport en PDF"
                >
                  <FileText className="w-3 h-3" />
                  <span>Rapport PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MessageBubble;
