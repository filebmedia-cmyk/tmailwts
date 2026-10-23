'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, X, RefreshCw } from 'lucide-react';

export type ConfirmType = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const config = {
    danger: {
      icon: <Trash2 className="w-7 h-7 text-rose-400 animate-wiggle" />,
      ring: 'border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      confirmBtn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-rose-400/50 shadow-rose-600/30',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      label: 'Tindakan Berbahaya',
    },
    warning: {
      icon: <AlertTriangle className="w-7 h-7 text-amber-400 animate-wiggle" />,
      ring: 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      confirmBtn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-amber-400/50 shadow-amber-600/30',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      label: 'Perlu Konfirmasi',
    },
    info: {
      icon: <Info className="w-7 h-7 text-cyan-400 animate-pulse" />,
      ring: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
      confirmBtn: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-blue-400/50 shadow-blue-600/30',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      label: 'Konfirmasi Aksi',
    },
  }[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => !isLoading && onCancel()}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0c122b] border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden p-6 text-slate-800 dark:text-slate-100 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background aura */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Central Animated Orbital Badge */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative mb-4 flex items-center justify-center">
            {/* Outer animated halo ring */}
            <div className="absolute w-20 h-20 rounded-full border border-current opacity-30 animate-pulse-glow" />
            <div className="absolute w-16 h-16 rounded-full border border-dashed border-current opacity-40 animate-orbit" />

            {/* Core badge capsule */}
            <div
              className={`relative z-10 w-14 h-14 rounded-2xl border flex items-center justify-center ${config.ring} animate-float`}
            >
              {config.icon}
            </div>
          </div>

          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-2 ${config.badge}`}
          >
            {config.label}
          </span>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl border font-semibold text-xs shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${config.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin-custom" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
