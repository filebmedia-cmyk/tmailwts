'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ActionToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function ActionToast({
  message,
  type = 'success',
  duration = 2800,
  onClose,
}: ActionToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-bounce" />,
      border: 'border-emerald-200/90 dark:border-emerald-500/40',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-500/30',
      bar: 'bg-emerald-500 dark:bg-emerald-400',
    },
    info: {
      icon: <Info className="w-4 h-4 text-sky-600 dark:text-cyan-400 shrink-0 animate-pulse" />,
      border: 'border-sky-200/90 dark:border-cyan-500/40',
      iconBg: 'bg-sky-50 dark:bg-cyan-950/70 border-sky-200 dark:border-cyan-500/30',
      bar: 'bg-sky-500 dark:bg-cyan-400',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-wiggle" />,
      border: 'border-amber-200/90 dark:border-amber-500/40',
      iconBg: 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-500/30',
      bar: 'bg-amber-500 dark:bg-amber-400',
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 animate-wiggle" />,
      border: 'border-rose-200/90 dark:border-rose-500/40',
      iconBg: 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-500/30',
      bar: 'bg-rose-500 dark:bg-rose-400',
    },
  }[type];

  return (
    <div className="fixed top-5 right-5 z-50 animate-toast-in pointer-events-auto">
      <div
        className={`relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#0c122b]/95 text-slate-800 dark:text-slate-100 px-3.5 py-2.5 backdrop-blur-xl border ${config.border} shadow-xl shadow-black/5 dark:shadow-black/35 flex items-center gap-2.5 max-w-xs sm:max-w-sm`}
      >
        {/* Compact Icon */}
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${config.iconBg}`}>
          {config.icon}
        </div>

        {/* Message */}
        <div className="text-xs font-semibold leading-snug pr-1 truncate sm:whitespace-normal">
          {message}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-auto"
          aria-label="Tutup Notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Slim Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full ${config.bar} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
