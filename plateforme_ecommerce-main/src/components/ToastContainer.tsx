/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgColor = 'bg-white';
          let borderColor = 'border-slate-200';
          let textColor = 'text-slate-800';
          let Icon = Info;
          let iconColor = 'text-blue-500';

          if (toast.type === 'success') {
            bgColor = 'bg-emerald-50';
            borderColor = 'border-emerald-200';
            textColor = 'text-emerald-900';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-500';
          } else if (toast.type === 'error') {
            bgColor = 'bg-rose-50';
            borderColor = 'border-rose-200';
            textColor = 'text-rose-900';
            Icon = AlertTriangle;
            iconColor = 'text-rose-500';
          } else if (toast.type === 'info') {
            bgColor = 'bg-slate-50';
            borderColor = 'border-slate-200';
            textColor = 'text-slate-900';
            Icon = Info;
            iconColor = 'text-slate-500';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgColor} ${borderColor} ${textColor} pointer-events-auto`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 font-sans text-sm font-medium leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
