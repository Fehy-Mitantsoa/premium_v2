/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  replies,
  onSelect,
  disabled = false,
}) => {
  if (!replies || replies.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Réponses rapides suggérées"
      className="px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar scrollbar-none"
    >
      {replies.map((reply, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="shrink-0 text-[11px] sm:text-xs bg-emerald-50 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-emerald-800 hover:text-white dark:text-emerald-300 dark:hover:text-white px-3 py-1.5 rounded-full border border-emerald-200/80 dark:border-slate-700 hover:border-emerald-600 transition-all cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

export default QuickReplies;
