import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { AIChatChartData } from "../../services/adminChatService";

interface ChartRendererProps {
  chart: AIChatChartData;
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chart }) => {
  if (!chart || !chart.data || chart.data.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 my-3 shadow-inner">
      {chart.title && (
        <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          {chart.title}
        </h5>
      )}

      <div className="w-full h-[180px] text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "bar" ? (
            <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  color: "#f8fafc",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chart.type === "line" ? (
            <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  color: "#f8fafc",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: "#10b981" }}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
              >
                {chart.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  color: "#f8fafc",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "9px", paddingTop: "5px" }}
                formatter={(value) => <span style={{ color: "#cbd5e1" }}>{value}</span>}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default ChartRenderer;
