import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AIChatKPI } from "../../services/adminChatService";

interface StatisticCardProps {
  kpi: AIChatKPI;
}

export const StatisticCard: React.FC<StatisticCardProps> = ({ kpi }) => {
  const isUp = kpi.trend === "up";
  const isDown = kpi.trend === "down";

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-all">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
        {kpi.label}
      </span>
      <div className="mt-1.5 flex items-baseline justify-between gap-1">
        <span className="text-base font-extrabold text-white tracking-tight">
          {kpi.value}
        </span>

        {kpi.change && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isUp
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : isDown
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {isUp && <TrendingUp className="w-2.5 h-2.5 shrink-0" />}
            {isDown && <TrendingDown className="w-2.5 h-2.5 shrink-0" />}
            {!isUp && !isDown && <Minus className="w-2.5 h-2.5 shrink-0" />}
            {kpi.change}
          </span>
        )}
      </div>
    </div>
  );
};
export default StatisticCard;
