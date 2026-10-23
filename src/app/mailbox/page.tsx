'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  RefreshCw,
  PlusSquare,
  Trash2,
  ChevronDown,
  Mail,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Radio,
  Satellite,
  Compass,
  Zap,
  History,
  Clock,
  ChevronRight,
  X,
  Link2
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import SpaceBackground from '@/components/SpaceBackground';
import ActionToast, { ToastType } from '@/components/ActionToast';
import ConfirmModal, { ConfirmType } from '@/components/ConfirmModal';
import { generateStructuredUsername } from '@/lib/name-generator';

interface MailboxHistoryRecord {
  address: string;
  createdAt: number;
}

interface DomainItem {
  domain: string;
  isDefault: boolean;
}

interface MessageItem {
  id: string;
  from: {
    address: string;
    name?: string;
  };
  to: string[];
  subject: string;
  receivedAt: string;
  isRead: boolean;
  otpCode?: string | null;
  verificationLinks?: string[];
  hasAttachments: boolean;
  preview: string;
}

interface FullMessage {
  id: string;
  mailboxAddress: string;
  from: {
    address: string;
    name?: string;
  };
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  otpCode?: string | null;
  verificationLinks?: string[];
  attachments?: any[];
  receivedAt: string;
}

export interface MailboxPageProps {
  initialAddress?: string;
}

export default function MailboxPage({ initialAddress }: MailboxPageProps = {}) {
  const [currentAddress, setCurrentAddress] = useState<string>(() => {
    if (initialAddress) {
      try {
        const decoded = decodeURIComponent(initialAddress).trim().toLowerCase();
        if (decoded.includes('@')) return decoded;
      } catch (_) {}
    }
    return '';
  });
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeMessage, setActiveMessage] = useState<FullMessage | null>(null);

  // UI Modes
  const [inApp, setInApp] = useState<boolean>(false);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState<boolean>(false);
  const [mailboxDropdownOpen, setMailboxDropdownOpen] = useState<boolean>(false);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [createdMailboxes, setCreatedMailboxes] = useState<MailboxHistoryRecord[]>([]);
  const [customUsername, setCustomUsername] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmType;
    onConfirm: () => void;
  } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'html' | 'text'>('html');

  const domainRef = useRef<HTMLDivElement>(null);
  const mailboxRef = useRef<HTMLDivElement>(null);

  const apiKey = 'admin123';

  // Secret shortcut for site owner: Ctrl + Shift + A or Alt + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        window.location.href = '/admin';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (domainRef.current && !domainRef.current.contains(event.target as Node)) {
        setDomainDropdownOpen(false);
      }
      if (mailboxRef.current && !mailboxRef.current.contains(event.target as Node)) {
        setMailboxDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
    showToast('Alamat email berhasil disalin ke clipboard!', 'success');
  };

  const copyInboxLink = (addr?: string) => {
    const target = addr || currentAddress;
    if (!target) return;
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/inbox/${encodeURIComponent(target)}`;
      navigator.clipboard.writeText(url);
      showToast('Link langsung inbox disalin!', 'success');
    }
  };

  const loadDomains = async (): Promise<DomainItem[]> => {
    try {
      const res = await fetch('/api/v1/domains');
      const data = await res.json();
      if (data.domains && data.domains.length > 0) {
        setDomains(data.domains);
        setSelectedDomain(data.domains[0].domain);
        return data.domains;
      }
    } catch (e) {
      console.error(e);
    }
    const fallback = [
      { domain: 'oursastore.com', isDefault: true },
    ];
    setDomains(fallback);
    setSelectedDomain('oursastore.com');
    return fallback;
  };

  const createNewMailbox = async (username?: string, domain?: string, updateUrl = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/mailbox/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          username: username?.trim() || undefined,
          domain: domain || selectedDomain,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.address) {
        const newAddr = data.data.address;
        setCurrentAddress(newAddr);
        localStorage.setItem('tmail_saved_address', newAddr);

        setCreatedMailboxes((prev) => {
          const filtered = prev.filter((a) => a.address !== newAddr);
          const updated = [{ address: newAddr, createdAt: Date.now() }, ...filtered].slice(0, 30);
          localStorage.setItem('tmail_address_history', JSON.stringify(updated));
          return updated;
        });

        setMessages([]);
        setActiveMessage(null);
        setInApp(false);
        setCustomUsername('');
        fetchMessages(newAddr);
        showToast('Email baru siap digunakan!');

        if (updateUrl && typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/inbox/${encodeURIComponent(newAddr)}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = useCallback(async (addr?: string, showFeedback = false) => {
    const addressToQuery = addr || currentAddress;
    if (!addressToQuery) return;

    if (showFeedback) setRefreshing(true);
    const start = Date.now();
    try {
      const res = await fetch(`/api/v1/mailbox/${encodeURIComponent(addressToQuery)}/messages`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
      if (showFeedback) {
        showToast('Kotak masuk berhasil diperbarui!', 'info');
      }
    } catch (e) {
      console.error(e);
      if (showFeedback) {
        showToast('Gagal memuat pesan baru.', 'error');
      }
    } finally {
      if (showFeedback) {
        const elapsed = Date.now() - start;
        const delay = Math.max(0, 750 - elapsed);
        setTimeout(() => {
          setRefreshing(false);
        }, delay);
      }
    }
  }, [currentAddress]);

  const handleManualRefresh = () => {
    if (refreshing) return;
    fetchMessages(undefined, true);
  };

  const openMessage = async (msgId: string) => {
    try {
      const res = await fetch(`/api/v1/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setActiveMessage(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const switchMailbox = (address: string) => {
    if (!address) return;
    const clean = address.trim().toLowerCase();
    setCurrentAddress(clean);
    localStorage.setItem('tmail_saved_address', clean);
    setCreatedMailboxes((prev) => {
      const existing = prev.find((a) => a.address.toLowerCase() === clean);
      const filtered = prev.filter((a) => a.address.toLowerCase() !== clean);
      const updated = [{ address: clean, createdAt: existing?.createdAt || Date.now() }, ...filtered].slice(0, 30);
      localStorage.setItem('tmail_address_history', JSON.stringify(updated));
      return updated;
    });
    setMessages([]);
    setActiveMessage(null);
    fetchMessages(clean);
    showToast(`Beralih ke: ${clean}`);

    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/inbox') || path.includes('@')) {
        window.history.replaceState(null, '', `/inbox/${encodeURIComponent(clean)}`);
      }
    }
  };

  const removeFromHistory = (addressToRemove: string) => {
    const remaining = createdMailboxes.filter((a) => a.address !== addressToRemove);
    setCreatedMailboxes(remaining);
    localStorage.setItem('tmail_address_history', JSON.stringify(remaining));

    if (addressToRemove === currentAddress) {
      if (remaining.length > 0) {
        switchMailbox(remaining[0].address);
      } else {
        localStorage.removeItem('tmail_saved_address');
        createNewMailbox();
      }
    }
    showToast('Email dihapus dari riwayat.', 'info');
  };

  const requestRemoveFromHistory = (addressToRemove: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Dari Riwayat?',
      message: `Hapus alamat email "${addressToRemove}" dari daftar riwayat tersimpan di perangkat Anda?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: () => {
        setConfirmModal(null);
        removeFromHistory(addressToRemove);
      },
    });
  };

  const requestClearAllHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Semua Riwayat Email?',
      message: 'Apakah Anda yakin ingin menghapus semua riwayat email yang pernah dibuat di browser ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Bersihkan Semua',
      cancelText: 'Batal',
      type: 'warning',
      onConfirm: () => {
        setConfirmModal(null);
        localStorage.removeItem('tmail_address_history');
        localStorage.removeItem('tmail_saved_address');
        setCreatedMailboxes([]);
        setHistoryModalOpen(false);
        createNewMailbox();
        showToast('Semua riwayat berhasil dibersihkan.', 'success');
      },
    });
  };

  const requestDeleteCurrentEmail = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Kotak Masuk Ini?',
      message: `Apakah Anda yakin ingin menghapus kotak masuk ${currentAddress}? Seluruh email dan pesan yang diterima akan dihapus secara permanen.`,
      confirmText: 'Ya, Hapus Sekarang',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await fetch(`/api/v1/mailbox/${encodeURIComponent(currentAddress)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          removeFromHistory(currentAddress);
          showToast('Kotak masuk berhasil dihapus!', 'success');
        } catch (e) {
          console.error(e);
          showToast('Gagal menghapus kotak masuk.', 'error');
        }
      },
    });
  };

  // Initial mount
  useEffect(() => {
    const init = async () => {
      const loaded = await loadDomains();
      const rawHistory = localStorage.getItem('tmail_address_history');
      let historyList: MailboxHistoryRecord[] = [];

      if (rawHistory) {
        try {
          const parsed = JSON.parse(rawHistory);
          if (Array.isArray(parsed)) {
            historyList = parsed.map((item) => {
              if (typeof item === 'string') {
                return { address: item, createdAt: Date.now() };
              }
              return {
                address: item.address || '',
                createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
              };
            }).filter((i) => Boolean(i.address));
          }
        } catch (_) {}
      }

      // Check direct address from URL param / query
      let directAddr = initialAddress ? decodeURIComponent(initialAddress).trim().toLowerCase() : '';
      if (!directAddr && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryAddr = urlParams.get('address') || urlParams.get('email');
        if (queryAddr && queryAddr.includes('@')) {
          directAddr = queryAddr.trim().toLowerCase();
        }
      }

      if (directAddr && directAddr.includes('@')) {
        if (!historyList.some((h) => h.address.toLowerCase() === directAddr)) {
          historyList = [{ address: directAddr, createdAt: Date.now() }, ...historyList];
          localStorage.setItem('tmail_address_history', JSON.stringify(historyList));
        }
        setCreatedMailboxes(historyList);
        setCurrentAddress(directAddr);
        localStorage.setItem('tmail_saved_address', directAddr);

        const domainPart = directAddr.split('@')[1];
        if (domainPart) {
          setSelectedDomain(domainPart);
        }

        setLoading(false);
        fetchMessages(directAddr);
        showToast(`Membuka kotak masuk: ${directAddr}`, 'info');
        return;
      }

      const savedAddr = localStorage.getItem('tmail_saved_address');
      if (savedAddr) {
        if (!historyList.some((h) => h.address === savedAddr)) {
          historyList = [{ address: savedAddr, createdAt: Date.now() }, ...historyList];
          localStorage.setItem('tmail_address_history', JSON.stringify(historyList));
        }
        setCreatedMailboxes(historyList);
        setCurrentAddress(savedAddr);
        setLoading(false);
        fetchMessages(savedAddr);
      } else if (historyList.length > 0) {
        const firstAddr = historyList[0].address;
        setCreatedMailboxes(historyList);
        setCurrentAddress(firstAddr);
        localStorage.setItem('tmail_saved_address', firstAddr);
        setLoading(false);
        fetchMessages(firstAddr);
      } else {
        createNewMailbox(undefined, loaded[0]?.domain, false);
      }
    };
    init();
  }, [initialAddress]);

  // Sync when initialAddress prop changes after mount
  useEffect(() => {
    if (initialAddress && currentAddress) {
      const clean = decodeURIComponent(initialAddress).trim().toLowerCase();
      if (clean.includes('@') && clean !== currentAddress.toLowerCase()) {
        switchMailbox(clean);
      }
    }
  }, [initialAddress, currentAddress]);

  // Auto-refresh interval (every 10 seconds, background polling without UI spin glitch)
  useEffect(() => {
    if (!currentAddress) return;
    const interval = setInterval(() => {
      fetchMessages(currentAddress, false);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentAddress, fetchMessages]);

  return (
    <div className="relative flex flex-col min-h-screen text-slate-800 dark:text-slate-100 overflow-x-hidden">
      {/* Futuristic Space Grid & Cosmic Particles Background */}
      <SpaceBackground />

      {/* Animated Action Feedback Toast */}
      {toast && (
        <ActionToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="relative z-10 grow flex flex-col lg:flex-row">
        {/* ========================================================= */}
        {/* LEFT SIDEBAR - AUTHENTIC TMAIL BLUE WITH COSMIC PARTICLES */}
        {/* ========================================================= */}
        <aside className="relative overflow-hidden w-full lg:w-1/4 py-8 px-6 lg:px-8 text-white flex flex-col justify-between shrink-0 shadow-2xl border-r border-blue-800/60 bg-[#0148a0]/90 dark:bg-[#07193b]/90 backdrop-blur-2xl">
          <div className="relative z-10">
            {/* Logo & Mobile Theme Toggle */}
            <div className="flex items-center justify-between px-2 mb-8 border-b border-white/20 pb-4">
              <div
                className="flex items-center gap-2.5 cursor-pointer select-none group"
                onDoubleClick={() => { window.location.href = '/admin'; }}
                title="TMail Mailbox"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center font-bold text-xl text-white shadow-inner group-hover:scale-105 group-hover:bg-white/25 transition-all">
                  T
                </div>
                <div>
                  <span className="font-bold text-3xl tracking-wide text-white font-['Kadwa',serif] block leading-none">
                    TMail
                  </span>
                  <span className="text-[10px] text-cyan-200 uppercase tracking-widest font-mono">
                    Cosmic Relay
                  </span>
                </div>
              </div>
              <div className="lg:hidden">
                <ThemeToggle className="bg-white/15 border border-white/30 text-white" />
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* VIEW A: DEFAULT IN-APP ACTIONS (4 BIG BUTTONS)            */}
            {/* --------------------------------------------------------- */}
            {!inApp ? (
              <div className="mt-2 space-y-4 lg:max-w-72 lg:mx-auto">
                {/* Active Address Box with Dropdown Selector (Bug-Free, unclipped) */}
                <div className="relative" ref={mailboxRef}>
                  <div
                    onClick={() => setMailboxDropdownOpen(!mailboxDropdownOpen)}
                    className="relative overflow-hidden rounded-2xl border border-white/30 hover:border-white/60 bg-white/15 hover:bg-white/20 backdrop-blur-xl shadow-xl transition-all block w-full text-white py-3.5 px-4 pr-10 cursor-pointer select-none group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-white/80 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                        <span>Alamat Email Aktif</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyInboxLink();
                        }}
                        className="text-[10px] text-cyan-200 hover:text-white bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-lg border border-white/20 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Salin Link Langsung Inbox"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Link Inbox</span>
                      </button>
                    </div>
                    <div className="font-mono text-sm truncate font-bold text-white mt-1 drop-shadow-sm">
                      {loading ? 'Generating Email...' : currentAddress || 'No Address'}
                    </div>

                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/80">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mailboxDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Dropdown Menu (Outside card, fully visible with z-50) */}
                  {mailboxDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1.5 text-slate-800 dark:text-slate-100 text-xs font-mono max-h-60 overflow-y-auto">
                      <div className="px-3 py-2 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>Pilih Email ({createdMailboxes.length})</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMailboxDropdownOpen(false);
                            setHistoryModalOpen(true);
                          }}
                          className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-sans normal-case text-[11px]"
                        >
                          <History className="w-3 h-3" />
                          <span>Kelola Riwayat</span>
                        </button>
                      </div>

                      {createdMailboxes.length === 0 ? (
                        <div className="px-3 py-3 text-center text-slate-400 font-sans text-xs">
                          Belum ada riwayat email.
                        </div>
                      ) : (
                        createdMailboxes.map((item) => {
                          const isCurrent = item.address === currentAddress;
                          return (
                            <div
                              key={item.address}
                              onClick={() => {
                                switchMailbox(item.address);
                                setMailboxDropdownOpen(false);
                              }}
                              className={`px-3 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 truncate border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 ${
                                isCurrent ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold' : ''
                              }`}
                            >
                              <span className="truncate">{item.address}</span>
                              {isCurrent && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-400 shrink-0" />
                              )}
                            </div>
                          );
                        })
                      )}

                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div
                          onClick={() => {
                            setMailboxDropdownOpen(false);
                            setInApp(true);
                          }}
                          className="px-3 py-2.5 text-blue-600 dark:text-cyan-400 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 font-sans"
                        >
                          <PlusSquare className="w-3.5 h-3.5" />
                          <span>+ Buat Alamat Baru</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tombol Riwayat Email yang Dibuat (Per User) */}
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 border border-white/25 hover:border-white/50 text-white transition-all cursor-pointer shadow-lg backdrop-blur-md group"
                  title="Lihat Daftar Riwayat Email yang Pernah Anda Buat"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                      <History className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white tracking-wide leading-tight">
                        Riwayat Email
                      </div>
                      <div className="text-[10px] text-cyan-200/80 font-medium">
                        Perangkat Anda
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30">
                      {createdMailboxes.length} tersimpan
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 4 Iconic Action Grid Buttons with Micro-Animations */}
                <div className="grid grid-cols-4 lg:grid-cols-2 gap-2.5 lg:gap-4">
                  {/* Button 1: Copy */}
                  <div
                    onClick={() => copyToClipboard(currentAddress)}
                    className="relative overflow-hidden group bg-white/10 hover:bg-white/20 text-white rounded-2xl py-4 lg:py-7 text-center cursor-pointer transition-all border border-white/25 hover:border-white/70 active:scale-95 shadow-lg backdrop-blur-md"
                    title="Salin Alamat Email"
                  >
                    <div className="relative z-10">
                      <div className="text-xl lg:text-3xl mx-auto flex items-center justify-center text-white/90 group-hover:scale-125 group-hover:-translate-y-1 transition-all duration-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]">
                        {copiedAddress ? (
                          <Check className="w-6 h-6 lg:w-7 lg:h-7 text-emerald-300 animate-wiggle shrink-0" />
                        ) : (
                          <Copy className="w-6 h-6 lg:w-7 lg:h-7 shrink-0" />
                        )}
                      </div>
                      <div className="text-xs lg:text-sm pt-2 font-medium tracking-wide">
                        {copiedAddress ? 'Copied!' : 'Copy'}
                      </div>
                    </div>
                  </div>

                  {/* Button 2: Refresh */}
                  <div
                    onClick={handleManualRefresh}
                    className="relative overflow-hidden group bg-white/10 hover:bg-white/20 text-white rounded-2xl py-4 lg:py-7 text-center cursor-pointer transition-all border border-white/25 hover:border-white/70 active:scale-95 shadow-lg backdrop-blur-md select-none"
                    title="Perbarui Kotak Masuk"
                  >
                    <div className="relative z-10">
                      <div className="text-xl lg:text-3xl mx-auto flex items-center justify-center text-white/90 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]">
                        <RefreshCw className={`w-6 h-6 lg:w-7 lg:h-7 shrink-0 transition-colors ${refreshing ? 'animate-spin-custom text-cyan-300 drop-shadow-[0_0_15px_#38bdf8]' : ''}`} />
                      </div>
                      <div className="text-xs lg:text-sm pt-2 font-medium tracking-wide">
                        {refreshing ? 'Syncing...' : 'Refresh'}
                      </div>
                    </div>
                  </div>

                  {/* Button 3: New */}
                  <div
                    onClick={() => setInApp(true)}
                    className="relative overflow-hidden group bg-white/10 hover:bg-white/20 text-white rounded-2xl py-4 lg:py-7 text-center cursor-pointer transition-all border border-white/25 hover:border-white/70 active:scale-95 shadow-lg backdrop-blur-md"
                    title="Buat Mailbox Baru"
                  >
                    <div className="relative z-10">
                      <div className="text-xl lg:text-3xl mx-auto flex items-center justify-center text-white/90 group-hover:scale-125 group-hover:rotate-90 transition-all duration-300 drop-shadow-[0_0_10px_rgba(192,132,252,0.6)]">
                        <PlusSquare className="w-6 h-6 lg:w-7 lg:h-7 shrink-0" />
                      </div>
                      <div className="text-xs lg:text-sm pt-2 font-medium tracking-wide">New</div>
                    </div>
                  </div>

                  {/* Button 4: Delete */}
                  <div
                    onClick={requestDeleteCurrentEmail}
                    className="relative overflow-hidden group bg-white/10 hover:bg-white/20 text-white rounded-2xl py-4 lg:py-7 text-center cursor-pointer transition-all border border-white/25 hover:border-white/70 active:scale-95 shadow-lg backdrop-blur-md"
                    title="Hapus Mailbox Ini"
                  >
                    <div className="relative z-10">
                      <div className="text-xl lg:text-3xl mx-auto flex items-center justify-center text-white/90 group-hover:scale-125 group-hover:animate-wiggle transition-all duration-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]">
                        <Trash2 className="w-6 h-6 lg:w-7 lg:h-7 shrink-0" />
                      </div>
                      <div className="text-xs lg:text-sm pt-2 font-medium tracking-wide">Delete</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* --------------------------------------------------------- */
              /* VIEW B: NEW EMAIL CREATION FORM                            */
              /* --------------------------------------------------------- */
              <div className="mt-2 space-y-4 lg:max-w-72 lg:mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createNewMailbox(customUsername, selectedDomain, true);
                  }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={customUsername}
                      onChange={(e) => setCustomUsername(e.target.value)}
                      placeholder="Username (misal: alex.miller)"
                      className="block w-full rounded-xl py-3.5 pl-4 pr-12 bg-white/15 text-white focus:outline-none placeholder-white/60 text-sm font-mono border border-white/35 focus:border-white shadow-md transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomName = generateStructuredUsername();
                        setCustomUsername(randomName);
                        showToast(`Nama diacak: ${randomName}`, 'info');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-cyan-200 hover:text-white transition-all cursor-pointer border border-white/20 flex items-center justify-center"
                      title="Acak nama rapi & natural"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative" ref={domainRef}>
                    <div
                      onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                      className="block w-full bg-white/15 text-white py-3.5 px-4 pr-8 rounded-xl cursor-pointer focus:outline-none select-none text-sm font-mono border border-white/35 hover:border-white/70 flex items-center justify-between shadow-md transition-colors"
                    >
                      <span>{selectedDomain || 'Select Domain'}</span>
                      <ChevronDown className="w-4 h-4 text-white/80" />
                    </div>

                    {domainDropdownOpen && (
                      <div className="absolute z-50 mt-2 w-full rounded-2xl shadow-2xl bg-white dark:bg-slate-900 py-1.5 text-slate-800 dark:text-slate-100 text-xs font-mono max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700">
                        {domains.map((d) => (
                        <div
                          key={d.domain}
                          onClick={() => {
                            setSelectedDomain(d.domain);
                            setDomainDropdownOpen(false);
                          }}
                          className={`px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/60 ${
                            selectedDomain === d.domain ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold' : ''
                          }`}
                        >
                          {d.domain}
                        </div>
                      ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="block w-full rounded-xl py-3.5 px-4 text-white text-center font-semibold cursor-pointer shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm border border-green-400"
                    style={{ backgroundColor: '#2fc10a' }}
                  >
                    Create
                  </button>

                  <div className="my-4 flex justify-center items-center">
                    <div className="border-t w-2/3 border-white/30"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => createNewMailbox(undefined, selectedDomain, true)}
                    className="block w-full rounded-xl py-3.5 px-4 text-white text-center font-semibold cursor-pointer shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm border border-amber-300"
                    style={{ backgroundColor: '#d2ab3e' }}
                  >
                    Random
                  </button>

                  <button
                    type="button"
                    onClick={() => setInApp(false)}
                    className="block w-full rounded-xl py-2.5 px-4 bg-white/10 text-white text-xs hover:bg-white/20 transition-all cursor-pointer border border-white/30"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Clean footer spacer */}
          <div className="py-2"></div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT AREA - NAVBAR, INBOX LIST, AND MESSAGE VIEWER       */}
        {/* ========================================================= */}
        <div className="grow w-full flex flex-col lg:w-3/4">
          {/* Top Navbar */}
          <nav className="bg-white/75 dark:bg-[#070b1a]/80 backdrop-blur-xl px-6 hidden lg:flex sticky top-0 z-40 h-20 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 text-xs font-semibold text-blue-700 dark:text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
                <span>Cosmic Relay Aktif</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Temporary Disposable Mailbox Service
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </nav>

          {/* Main Dual-Column Inbox Body */}
          <main className="flex-1 lg:flex grow">
            {/* 1. Left Column: Inbox Message List */}
            <div className="w-full lg:w-1/3 bg-white/80 dark:bg-[#090d21]/80 backdrop-blur-xl flex flex-col border-r border-slate-200/80 dark:border-slate-800/80">
              {/* Inbox Header with Animated Refresh Icon */}
              <div className="relative overflow-hidden p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/80 dark:bg-[#0d1433]/80 backdrop-blur-xl">
                <div className="relative z-10 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 animate-float" />
                  </div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Kotak Masuk
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                    {messages.length}
                  </span>
                </div>

                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="relative z-10 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 hover:border-blue-400 transition-all shadow-xs disabled:opacity-75"
                >
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${refreshing ? 'animate-spin-custom text-cyan-400' : ''}`} />
                  <span>{refreshing ? 'Memperbarui...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Message List or Cosmic Empty Mail State */}
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                {messages.length === 0 ? (
                  /* ========================================================= */
                  /* MAIL KOSONG (INBOX LIST RADAR & SATELLITE ANIMATION)      */
                  /* ========================================================= */
                  <div className="relative flex flex-col justify-center items-center h-80 text-slate-400 dark:text-slate-500 p-6 text-center overflow-hidden">
                    {/* Concentric cosmic radar waves and orbital satellite */}
                    <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                      {/* Radar sweep ring 1 */}
                      <div className="absolute inset-0 rounded-full border border-blue-500/25 dark:border-blue-400/20 animate-cosmic-radar" />
                      {/* Radar sweep ring 2 with delay */}
                      <div className="absolute inset-0 rounded-full border border-cyan-500/25 dark:border-cyan-400/20 animate-cosmic-radar [animation-delay:1.2s]" />

                      {/* Dashed Circular Orbit Track */}
                      <div className="absolute inset-0 rounded-full border border-cyan-400/40 dark:border-cyan-500/30 border-dashed" />

                      {/* Orbiting Satellite Dot (Centered directly on the orbit track) */}
                      <div className="absolute inset-0 rounded-full animate-orbit pointer-events-none">
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 dark:bg-cyan-300 shadow-[0_0_10px_#38bdf8]" />
                      </div>

                      {/* Floating Cosmic Mail Capsule */}
                      <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 dark:from-blue-600/90 dark:to-cyan-600/90 border border-blue-400/50 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 animate-float">
                        <Mail className="w-7 h-7 text-white drop-shadow-md" />
                      </div>
                    </div>

                    {/* Cosmic Radar Status Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-cyan-300 text-[11px] font-semibold uppercase tracking-wider mb-2 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                      <span>Scanning Kosmik Aktif</span>
                    </div>

                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Menunggu Email Masuk...
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Kirim email ke <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold break-all">{currentAddress}</span>. Transmisi akan tertangkap otomatis dalam beberapa detik.
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => openMessage(m.id)}
                      className={`p-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all border-b border-slate-200/80 dark:border-slate-800/80 ${
                        activeMessage?.id === m.id
                          ? 'bg-blue-50/90 dark:bg-blue-950/50 border-l-4 border-l-blue-600 shadow-xs'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                          {m.from.name || m.from.address}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {new Date(m.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {m.subject || '(No Subject)'}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {m.preview}
                      </div>

                      {/* Detected OTP pill */}
                      {m.otpCode && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs">
                          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                          <span>OTP: {m.otpCode}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Right Column: Message Detail Reader */}
            <div className="w-full lg:w-2/3 bg-white/70 dark:bg-[#060a1a]/70 backdrop-blur-xl flex flex-col">
              {activeMessage ? (
                <div className="flex flex-col h-full">
                  {/* Header Box */}
                  <div className="relative overflow-hidden p-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0c122b]/85 space-y-4 backdrop-blur-xl">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {activeMessage.subject || '(No Subject)'}
                      </h2>
                      <span className="text-xs text-slate-500 shrink-0 font-medium">
                        {new Date(activeMessage.receivedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="text-slate-700 dark:text-slate-300">
                          <span className="text-slate-400">From: </span>
                          <strong>{activeMessage.from.name || ''}</strong> &lt;{activeMessage.from.address}&gt;
                        </div>
                        <div className="text-slate-500">
                          <span className="text-slate-400">To: </span>
                          {activeMessage.to.join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium">
                        <button
                          onClick={() => setViewTab('html')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            viewTab === 'html' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          HTML
                        </button>
                        <button
                          onClick={() => setViewTab('text')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            viewTab === 'text' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          Text
                        </button>
                      </div>
                    </div>

                    {/* Auto-extracted OTP Banner */}
                    {activeMessage.otpCode && (
                      <div className="relative overflow-hidden p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-4 shadow-xl ring-1 ring-emerald-500/20 backdrop-blur-xl">
                        <div className="relative z-10">
                          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                            <span>Verification Code Detected</span>
                          </div>
                          <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white tracking-widest mt-0.5">
                            {activeMessage.otpCode}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(activeMessage.otpCode!)}
                          className="relative z-10 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-emerald-400"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy OTP</span>
                        </button>
                      </div>
                    )}

                    {/* Verification Link Banner */}
                    {activeMessage.verificationLinks && activeMessage.verificationLinks.length > 0 && (
                      <div className="relative overflow-hidden p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 flex items-center justify-between gap-3 text-xs shadow-md ring-1 ring-blue-500/20">
                        <span className="text-blue-900 dark:text-blue-300 font-semibold truncate">
                          Tautan verifikasi ditemukan:
                        </span>
                        <a
                          href={activeMessage.verificationLinks[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 shrink-0 border border-blue-400 shadow-sm"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Body Content Box */}
                  <div className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-280px)]">
                    <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg min-h-[320px]">
                      {viewTab === 'html' && activeMessage.html ? (
                        <div
                          className="email-rendered-html text-slate-800 dark:text-slate-200"
                          dangerouslySetInnerHTML={{ __html: activeMessage.html }}
                        />
                      ) : (
                        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                          {activeMessage.text || 'No text content available.'}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ========================================================= */
                /* MAIL KOSONG (DEEP SPACE OBSERVATORY NO-MESSAGE STATE)     */
                /* ========================================================= */
                <div className="relative flex-1 hidden lg:flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-slate-500 overflow-hidden">
                  {/* Cosmic Orbital Scanner with Exact Satellite Tracks */}
                  <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                    {/* Cosmic Nebula Glow */}
                    <div className="absolute w-36 h-36 rounded-full bg-blue-500/15 dark:bg-blue-500/20 blur-2xl animate-pulse-glow" />

                    {/* Outer dashed orbit ring */}
                    <div className="absolute inset-0 rounded-full border border-cyan-400/35 dark:border-cyan-500/30 border-dashed" />
                    {/* Outer satellite orbiting clockwise exactly on the outer ring */}
                    <div className="absolute inset-0 rounded-full animate-orbit pointer-events-none">
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8]" />
                    </div>

                    {/* Middle dashed orbit ring */}
                    <div className="absolute inset-6 rounded-full border border-purple-400/35 dark:border-purple-500/30 border-dashed" />
                    {/* Middle satellite orbiting counter-clockwise exactly on middle ring */}
                    <div className="absolute inset-6 rounded-full animate-orbit-reverse pointer-events-none">
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />
                    </div>

                    {/* Inner subtle glow ring */}
                    <div className="absolute inset-10 rounded-full border border-indigo-400/20 dark:border-indigo-500/20" />

                    {/* Central Floating Cosmic Mailbox */}
                    <div className="relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-white/30 animate-float">
                      <Inbox className="w-10 h-10 text-white drop-shadow-md" />
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Deep Space Mail Receiver Siap</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Belum ada pesan yang dipilih
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Pilih salah satu email di panel kiri untuk melihat isi pesan, kode verifikasi OTP otomatis, atau tautan konfirmasi.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Clean Footer */}
          <footer className="bg-slate-900/90 backdrop-blur-xl px-6 py-4 text-slate-300 text-xs flex justify-between items-center border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="opacity-75">Copyright &copy; 2026 TMail. All rights reserved.</div>
            <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Cloudflare Worker + MongoDB Engine</span>
            </div>
          </footer>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL RIWAYAT EMAIL YANG DIBUAT (PER USER)                */}
      {/* ========================================================= */}
      {historyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setHistoryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#0c122b] border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#070b1a]/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Riwayat Email Dibuat
                    </h3>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Sesi Pengguna Anda
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Daftar alamat email sementara yang pernah Anda buat di browser ini ({createdMailboxes.length} email).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - List of Mailboxes */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {createdMailboxes.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Mail className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Belum Ada Riwayat Email
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                    Setiap kali Anda membuat alamat baru, email tersebut akan otomatis tercatat di sini.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryModalOpen(false);
                      setInApp(true);
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                  >
                    + Buat Email Sekarang
                  </button>
                </div>
              ) : (
                createdMailboxes.map((item) => {
                  const isCurrent = item.address === currentAddress;
                  const formattedDate = new Date(item.createdAt).toLocaleDateString([], {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.address}
                      className={`relative p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-cyan-500/60 ring-2 ring-blue-500/20'
                          : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white truncate block">
                            {item.address}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Sedang Digunakan</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>Dibuat: {formattedDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Gunakan Email */}
                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() => {
                              switchMailbox(item.address);
                              setHistoryModalOpen(false);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
                          >
                            Gunakan
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              fetchMessages(item.address);
                              setHistoryModalOpen(false);
                              showToast('Memperbarui kotak masuk...');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer"
                          >
                            Refresh
                          </button>
                        )}

                        {/* Copy Email Button */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.address)}
                          className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-300/80 dark:border-slate-700"
                          title="Salin Alamat Email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Direct Inbox Link Button */}
                        <button
                          type="button"
                          onClick={() => copyInboxLink(item.address)}
                          className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors cursor-pointer border border-slate-300/80 dark:border-slate-700"
                          title="Salin Link Langsung Inbox (/inbox/...)"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete from History */}
                        <button
                          type="button"
                          onClick={() => requestRemoveFromHistory(item.address)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/50"
                          title="Hapus dari Riwayat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#070b1a]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                Riwayat ini tersimpan aman di browser Anda.
              </div>

              <div className="flex items-center gap-2">
                {createdMailboxes.length > 0 && (
                  <button
                    type="button"
                    onClick={requestClearAllHistory}
                    className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/50"
                  >
                    Hapus Semua Riwayat
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setHistoryModalOpen(false);
                    setInApp(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>+ Buat Email Baru</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Pop-up Konfirmasi Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
