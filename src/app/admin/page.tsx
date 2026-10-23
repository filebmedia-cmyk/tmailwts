'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Code2,
  Terminal,
  Settings,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  Play,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2,
  User,
  Lock,
  LogOut,
  CheckCircle2,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import SpaceBackground from '@/components/SpaceBackground';
import ActionToast, { ToastType } from '@/components/ActionToast';
import ConfirmModal, { ConfirmType } from '@/components/ConfirmModal';

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastUsedAt?: string;
  totalRequests: number;
}

interface DomainItem {
  domain: string;
  isDefault: boolean;
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(false);
  const [currentAdminUser, setCurrentAdminUser] = useState<string>('admin');

  // Login form state
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Sidebar mobile state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Dashboard Data
  const [activeTab, setActiveTab] = useState<'keys' | 'tester' | 'domains' | 'security'>('keys');
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [copiedText, setCopiedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Key creation modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [createdKey, setCreatedKey] = useState<ApiKeyItem | null>(null);

  // Key edit modal
  const [editKey, setEditKey] = useState<ApiKeyItem | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  // Domain state
  const [newDomain, setNewDomain] = useState<string>('');

  // Change credentials state
  const [credForm, setCredForm] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [credMessage, setCredMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Interactive tester state
  const [selectedKeyForTest, setSelectedKeyForTest] = useState<string>('');
  const [selectedDomainForTest, setSelectedDomainForTest] = useState<string>('');
  const [testMailbox, setTestMailbox] = useState<string>('');
  const [customTestUsername, setCustomTestUsername] = useState<string>('');
  const [testResultJson, setTestResultJson] = useState<any>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [extractedOtp, setExtractedOtp] = useState<string | null>(null);

  // Code snippets language
  const [codeLang, setCodeLang] = useState<'python' | 'node' | 'telegram' | 'curl'>('python');

  // Animated Action Toast & Confirm Modal states
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

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
    showToast('Berhasil disalin ke clipboard!', 'success');
  };

  // Check login status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setAuthChecking(true);
    try {
      const res = await fetch('/api/admin/status');
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setCurrentAdminUser(data.username || 'admin');
        loadAdminData();
      } else {
        setIsAuthenticated(false);
      }
    } catch (_) {
      setIsAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setCurrentAdminUser(data.username || loginUsername);
        loadAdminData();
      } else {
        setLoginError(data.error || 'Username atau password salah.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Gagal terhubung ke server');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setLoginPassword('');
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load keys
      const kRes = await fetch('/api/v1/keys');
      const kData = await kRes.json();
      if (kData.success && Array.isArray(kData.data)) {
        setKeys(kData.data);
        if (kData.data.length > 0 && !selectedKeyForTest) {
          setSelectedKeyForTest(kData.data[0].key);
        }
      }

      // Load domains
      const dRes = await fetch('/api/v1/domains');
      const dData = await dRes.json();
      if (dData.success && Array.isArray(dData.domains)) {
        setDomains(dData.domains);
        if (dData.domains.length > 0 && !selectedDomainForTest) {
          setSelectedDomainForTest(dData.domains[0].domain);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() || 'Bot Automation Key' }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedKey(data.data);
        setNewKeyName('');
        loadAdminData();
        showToast('API Key baru berhasil dibuat!', 'success');
      } else {
        showToast(data.error || 'Gagal membuat API Key', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/keys/${editKey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditKey(null);
        loadAdminData();
        showToast('API Key berhasil diperbarui!', 'success');
      } else {
        showToast(data.error || 'Gagal memperbarui API Key', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus API Key Ini?',
      message: `Hapus token "${name}" secara permanen? Seluruh script bot atau integrasi otomatis yang menggunakan token ini tidak dapat mengakses endpoint lagi.`,
      confirmText: 'Ya, Hapus API Key',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await fetch(`/api/v1/keys/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            loadAdminData();
            showToast(`API Key "${name}" berhasil dihapus!`, 'success');
          } else {
            showToast(data.error || 'Gagal menghapus API Key', 'error');
          }
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    try {
      const res = await fetch('/api/v1/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const added = newDomain.trim();
        setNewDomain('');
        loadAdminData();
        showToast(`Domain "${added}" berhasil ditambahkan!`, 'success');
      } else {
        showToast(data.error || 'Gagal menambahkan domain', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteDomain = (domain: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Domain Email?',
      message: `Hapus domain "${domain}" dari sistem TMail? Alamat email dengan domain ini tidak akan bisa menerima pesan baru.`,
      confirmText: 'Ya, Hapus Domain',
      cancelText: 'Batal',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await fetch(`/api/v1/domains?domain=${encodeURIComponent(domain)}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            loadAdminData();
            showToast(`Domain "${domain}" berhasil dihapus!`, 'success');
          } else {
            showToast(data.error || 'Gagal menghapus domain', 'error');
          }
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMessage(null);

    if (credForm.newPassword && credForm.newPassword !== credForm.confirmPassword) {
      setCredMessage({ type: 'error', text: 'Konfirmasi password baru tidak cocok!' });
      return;
    }

    try {
      const res = await fetch('/api/admin/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: credForm.currentPassword,
          newUsername: credForm.newUsername || undefined,
          newPassword: credForm.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCredMessage({ type: 'success', text: data.message || 'Kredensial berhasil diubah!' });
        if (data.data?.username) {
          setCurrentAdminUser(data.data.username);
        }
        setCredForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
      } else {
        setCredMessage({ type: 'error', text: data.error || 'Gagal mengubah kredensial' });
      }
    } catch (err: any) {
      setCredMessage({ type: 'error', text: err.message });
    }
  };

  // Tester Actions
  const runCreateMailboxTest = async () => {
    setTestLoading(true);
    setTestResultJson(null);
    try {
      const res = await fetch('/api/v1/mailbox/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${selectedKeyForTest}`,
        },
        body: JSON.stringify({
          username: customTestUsername.trim() || undefined,
          domain: selectedDomainForTest || undefined,
        }),
      });
      const data = await res.json();
      setTestResultJson(data);
      if (data.success && data.data?.address) {
        setTestMailbox(data.data.address);
      }
    } catch (err: any) {
      setTestResultJson({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const runMockEmailTest = async () => {
    if (!testMailbox) {
      alert('Buat mailbox terlebih dahulu di langkah 1!');
      return;
    }
    setTestLoading(true);
    setTestResultJson(null);
    try {
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const res = await fetch('/api/webhook/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 'tm_whsec_cloudflare_secret_2026',
        },
        body: JSON.stringify({
          to: [testMailbox],
          from: { address: 'no-reply@instagram.com', name: 'Instagram Security' },
          subject: `${randomOtp} is your Instagram verification code`,
          text: `Hi! Your Instagram security code is ${randomOtp}. Don't share it with anyone.`,
          html: `<p>Your code is: <b>${randomOtp}</b></p>`,
        }),
      });
      const data = await res.json();
      setTestResultJson({
        _notice: 'SIMULASI EMAIL SUKSES DITERIMA SERVER!',
        sentOtp: randomOtp,
        webhookResponse: data,
      });
    } catch (err: any) {
      setTestResultJson({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const runPollOtpTest = async () => {
    if (!testMailbox) {
      alert('Pilih mailbox terlebih dahulu!');
      return;
    }
    setTestLoading(true);
    setTestResultJson(null);
    try {
      const res = await fetch(`/api/v1/mailbox/${encodeURIComponent(testMailbox)}/latest-otp`, {
        headers: { Authorization: `Bearer ${selectedKeyForTest}` },
      });
      const data = await res.json();
      setTestResultJson(data);
      if (data.otpCode) {
        setExtractedOtp(data.otpCode);
      }
    } catch (err: any) {
      setTestResultJson({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const runDeleteMailboxTest = async () => {
    if (!testMailbox) return;
    setTestLoading(true);
    try {
      const res = await fetch(`/api/v1/mailbox/${encodeURIComponent(testMailbox)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${selectedKeyForTest}` },
      });
      const data = await res.json();
      setTestResultJson(data);
      if (data.success) {
        setTestMailbox('');
        setExtractedOtp(null);
      }
    } catch (err: any) {
      setTestResultJson({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  // Code generator dynamic values
  const activeKeyForCode = selectedKeyForTest || keys[0]?.key || 'tm_live_your_api_key';
  const activeDomainForCode = selectedDomainForTest || domains[0]?.domain || 'tmailku.space';

  const snippets = {
    python: `# Python 3 Bot (requests)
import requests
import time

API_KEY = "${activeKeyForCode}"
BASE_URL = "http://localhost:3000" # Domain Vercel Anda
headers = {"Authorization": f"Bearer {API_KEY}"}

# 1. Buat Mailbox Baru
print("[*] Generating disposable mailbox...")
res = requests.post(f"{BASE_URL}/api/v1/mailbox/create", headers=headers, json={
    "domain": "${activeDomainForCode}"
})
mailbox = res.json()["data"]["address"]
print(f"[+] Mailbox ready: {mailbox}")

# Lakukan registrasi bot pada situs target...

# 2. Polling Kode OTP Otomatis
print("[*] Polling for OTP code...")
for _ in range(12):
    time.sleep(5)
    poll = requests.get(f"{BASE_URL}/api/v1/mailbox/{mailbox}/latest-otp", headers=headers).json()
    if poll.get("hasEmail") and poll.get("otpCode"):
        print(f"[SUCCESS] OTP CODE: {poll['otpCode']}")
        break

# 3. Cleanup Mailbox
requests.delete(f"{BASE_URL}/api/v1/mailbox/{mailbox}", headers=headers)
`,

    node: `// Node.js (Axios)
import axios from 'axios';

const API_KEY = '${activeKeyForCode}';
const BASE_URL = 'http://localhost:3000';
const client = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: \`Bearer \${API_KEY}\` }
});

async function run() {
  const create = await client.post('/api/v1/mailbox/create', { domain: '${activeDomainForCode}' });
  const mailbox = create.data.data.address;
  console.log('Mailbox dibuat:', mailbox);

  // Tunggu OTP
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 4000));
    const otpRes = await client.get(\`/api/v1/mailbox/\${encodeURIComponent(mailbox)}/latest-otp\`);
    if (otpRes.data.hasEmail && otpRes.data.otpCode) {
      console.log('KODE OTP DIDAPATKAN:', otpRes.data.otpCode);
      break;
    }
  }

  // Cleanup
  await client.delete(\`/api/v1/mailbox/\${encodeURIComponent(mailbox)}\`);
}
run();
`,

    telegram: `# Bot Telegram Python
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
import requests

API_KEY = "${activeKeyForCode}"
BASE_URL = "http://localhost:3000"

async def email_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    res = requests.post(f"{BASE_URL}/api/v1/mailbox/create", headers={"Authorization": f"Bearer {API_KEY}"})
    email = res.json()["data"]["address"]
    context.user_data["email"] = email
    await update.message.reply_text(f"Email Anda: \`{email}\`\\nKetik /otp untuk mengambil kode verifikasi.", parse_mode="Markdown")

async def otp_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    email = context.user_data.get("email")
    if not email:
        return await update.message.reply_text("Ketik /email terlebih dahulu!")
    poll = requests.get(f"{BASE_URL}/api/v1/mailbox/{email}/latest-otp", headers={"Authorization": f"Bearer {API_KEY}"}).json()
    if poll.get("hasEmail") and poll.get("otpCode"):
        await update.message.reply_text(f"🔥 KODE OTP: *{poll['otpCode']}*", parse_mode="Markdown")
    else:
        await update.message.reply_text("Belum ada email masuk. Coba ketik /otp lagi.")

app = ApplicationBuilder().token("YOUR_TELEGRAM_TOKEN").build()
app.add_handler(CommandHandler("email", email_cmd))
app.add_handler(CommandHandler("otp", otp_cmd))
app.run_polling()
`,

    curl: `# 1. Buat Mailbox Baru
curl -X POST "http://localhost:3000/api/v1/mailbox/create" \\
  -H "Authorization: Bearer ${activeKeyForCode}" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "${activeDomainForCode}"}'

# 2. Ambil Kode OTP Langsung
curl -X GET "http://localhost:3000/api/v1/mailbox/user@${activeDomainForCode}/latest-otp" \\
  -H "Authorization: Bearer ${activeKeyForCode}"
`
  };

  // If loading session check
  if (authChecking) {
    return (
      <div className="relative min-h-screen text-slate-800 dark:text-white flex items-center justify-center">
        <SpaceBackground />
        <RefreshCw className="relative z-10 w-8 h-8 animate-spin-custom text-blue-500" />
      </div>
    );
  }

  // =========================================================
  // VIEW 1: ADMIN LOGIN SCREEN (Username & Password)
  // =========================================================
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen text-slate-800 dark:text-white flex flex-col justify-center items-center px-4 py-12 transition-colors overflow-hidden">
        {/* Space Grid & Particles Canvas */}
        <SpaceBackground />

        {/* Top Right Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-md p-8 bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 border border-blue-500/50 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/25 shrink-0">
              <ShieldCheck className="w-7 h-7 shrink-0" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Login</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Masuk untuk mengelola API Key, Bot Endpoints, Domain, dan Pengaturan Sistem.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 shrink-0" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password admin..."
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 shrink-0" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer border border-blue-500"
            >
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin-custom shrink-0" /> : <Key className="w-4 h-4 shrink-0" />}
              <span>Masuk ke Panel Admin</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/mailbox" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              ← Kembali ke Web Mailbox
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD WITH SIDEBAR
  // =========================================================
  return (
    <div className="relative min-h-screen text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row transition-colors overflow-x-hidden">
      {/* Space Grid & Particles Canvas */}
      <SpaceBackground />

      {/* Mobile Top Header (Visible on small screens) */}
      <header className="relative z-40 lg:hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#070b1a]/85 backdrop-blur-xl sticky top-0 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shrink-0"
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5 shrink-0" /> : <Menu className="w-5 h-5 shrink-0" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold shrink-0">
              <ShieldCheck className="w-4 h-4 shrink-0" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">TMail Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            title="Keluar"
            className="w-9 h-9 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Menu */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/85 dark:bg-[#070b1a]/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:h-screen lg:shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">TMail Admin</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Management Console
              </span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Main Menu Section */}
          <div className="space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menu Utama
            </div>

            {/* Nav 1: API Keys */}
            <button
              onClick={() => {
                setActiveTab('keys');
                setSidebarOpen(false);
              }}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'keys'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-blue-200 dark:border-blue-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    activeTab === 'keys'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                  }`}
                >
                  <Key className="w-4 h-4 shrink-0" />
                </div>
                <div className="truncate">
                  <span className="block truncate font-semibold">API Keys Bot</span>
                  <span className="block text-[10px] font-normal text-slate-400 dark:text-slate-500">
                    Token akses skrip
                  </span>
                </div>
              </div>
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  activeTab === 'keys'
                    ? 'bg-blue-200/80 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {keys.length}
              </span>
            </button>

            {/* Nav 2: Tester & Playground */}
            <button
              onClick={() => {
                setActiveTab('tester');
                setSidebarOpen(false);
              }}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'tester'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs border border-emerald-200 dark:border-emerald-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    activeTab === 'tester'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                  }`}
                >
                  <Play className="w-4 h-4 shrink-0" />
                </div>
                <div className="truncate">
                  <span className="block truncate font-semibold">Live Tester &amp; Bot</span>
                  <span className="block text-[10px] font-normal text-slate-400 dark:text-slate-500">
                    Simulator &amp; snippet
                  </span>
                </div>
              </div>
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                Live
              </span>
            </button>

            {/* Nav 3: Domain Email */}
            <button
              onClick={() => {
                setActiveTab('domains');
                setSidebarOpen(false);
              }}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'domains'
                  ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-semibold shadow-xs border border-cyan-200 dark:border-cyan-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    activeTab === 'domains'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/50 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                </div>
                <div className="truncate">
                  <span className="block truncate font-semibold">Domain Email</span>
                  <span className="block text-[10px] font-normal text-slate-400 dark:text-slate-500">
                    Routing &amp; DNS domain
                  </span>
                </div>
              </div>
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  activeTab === 'domains'
                    ? 'bg-cyan-200/80 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {domains.length}
              </span>
            </button>

            {/* Nav 4: Security & Credentials */}
            <button
              onClick={() => {
                setActiveTab('security');
                setSidebarOpen(false);
              }}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold shadow-xs border border-purple-200 dark:border-purple-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    activeTab === 'security'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/50 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                  }`}
                >
                  <Lock className="w-4 h-4 shrink-0" />
                </div>
                <div className="truncate">
                  <span className="block truncate font-semibold">Kredensial &amp; Akun</span>
                  <span className="block text-[10px] font-normal text-slate-400 dark:text-slate-500">
                    Ganti username &amp; sandi
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-1.5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tautan Cepat
            </div>

            <Link
              href="/mailbox"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all border border-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 shrink-0" />
                </div>
                <span>Buka Web Mailbox</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Sidebar Footer: User Card & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">
                <User className="w-4 h-4 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {currentAdminUser}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span>Administrator</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Keluar dari Admin"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-[#070b1a]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <span className="text-slate-400">Admin</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {activeTab === 'keys' && 'Manajemen API Key'}
              {activeTab === 'tester' && 'Live Tester & Endpoints'}
              {activeTab === 'domains' && 'Domain Email'}
              {activeTab === 'security' && 'Kredensial & Keamanan'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/mailbox"
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-all shadow-xs"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Web Mailbox</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ------------------------------------------------------------- */}
          {/* TAB 1: API KEYS MANAGEMENT                                    */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daftar API Key untuk Bot</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Gunakan token ini untuk mengaitkan script bot Anda (Telegram bot, Shopee auto-signup, QA automation).
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCreatedKey(null);
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer self-start border border-blue-500 shrink-0"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Generate API Key Baru</span>
                </button>
              </div>

              {keys.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white/80 dark:bg-[#0c1229]/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-black/5 dark:shadow-black/20">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 shrink-0">
                    <Key className="w-6 h-6 shrink-0" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada API Key</p>
                  <p className="text-xs text-slate-500 mb-4 mt-0.5">Buat token API pertama Anda untuk bot automation.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer border border-blue-500 shadow-xs"
                  >
                    Buat API Key
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      className="p-5 rounded-2xl bg-white/80 dark:bg-[#0c1229]/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400/50 dark:hover:border-blue-500/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-md shadow-black/5 dark:shadow-black/20"
                    >
                      <div className="space-y-2.5 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{k.name}</span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              k.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                k.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {k.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-blue-600 dark:text-cyan-300 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 select-all max-w-full overflow-x-auto">
                            {k.key || k.maskedKey}
                          </code>
                          <button
                            onClick={() => copyToClipboard(k.key || k.maskedKey)}
                            title="Salin Token"
                            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs"
                          >
                            {copiedText === (k.key || k.maskedKey) ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Copy className="w-4 h-4 shrink-0" />
                            )}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Dibuat: {new Date(k.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Total Request: <strong className="text-slate-800 dark:text-white">{k.totalRequests || 0}</strong></span>
                          {k.lastUsedAt && (
                            <>
                              <span>•</span>
                              <span>Terakhir Digunakan: {new Date(k.lastUsedAt).toLocaleTimeString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        <button
                          onClick={() => {
                            setSelectedKeyForTest(k.key);
                            setActiveTab('tester');
                          }}
                          className="h-9 px-3.5 rounded-xl text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 shrink-0" />
                          <span>Test di Playground</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditKey(k);
                            setEditName(k.name);
                            setEditStatus(k.status);
                          }}
                          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs"
                          title="Edit Key"
                        >
                          <Edit2 className="w-4 h-4 shrink-0" />
                        </button>

                        <button
                          onClick={() => handleDeleteKey(k.id, k.name)}
                          className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                          title="Hapus Key"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: ENDPOINTS DOCUMENTATION & LIVE PLAYGROUND TESTER        */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'tester' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#0c1229]/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-6 shadow-xl shadow-black/5 dark:shadow-black/25">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Interactive Endpoint Tester &amp; Bot Simulator
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Uji coba endpoint tanpa perlu Postman. Buat email &rarr; kirim simulasi OTP &rarr; polling kode OTP.
                    </p>
                  </div>
                </div>

                {/* Selector Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">
                      API Key yang Digunakan:
                    </label>
                    <select
                      value={selectedKeyForTest}
                      onChange={(e) => setSelectedKeyForTest(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      {keys.map((k) => (
                        <option key={k.id} value={k.key}>
                          {k.name} ({k.maskedKey})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">
                      Domain Email:
                    </label>
                    <select
                      value={selectedDomainForTest}
                      onChange={(e) => setSelectedDomainForTest(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      {domains.map((d) => (
                        <option key={d.domain} value={d.domain}>
                          @{d.domain}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">
                      Active Test Mailbox:
                    </label>
                    <input
                      type="text"
                      value={testMailbox}
                      onChange={(e) => setTestMailbox(e.target.value)}
                      placeholder="Klik '1. Create Mailbox'..."
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono text-blue-600 dark:text-cyan-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Step 1 */}
                  <button
                    onClick={runCreateMailboxTest}
                    disabled={testLoading}
                    className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 text-left transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                        Step 1
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Create Mailbox</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">POST /mailbox/create</div>
                    </div>
                  </button>

                  {/* Step 2 */}
                  <button
                    onClick={runMockEmailTest}
                    disabled={testLoading || !testMailbox}
                    className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between gap-3 border ${
                      testMailbox
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 border-amber-200 dark:border-amber-800/80 cursor-pointer shadow-xs'
                        : 'bg-slate-100/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                        Step 2
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-amber-600/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Simulasi Email Masuk</div>
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">Simulate OTP via Webhook</div>
                    </div>
                  </button>

                  {/* Step 3 */}
                  <button
                    onClick={runPollOtpTest}
                    disabled={testLoading || !testMailbox}
                    className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between gap-3 border ${
                      testMailbox
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80 cursor-pointer shadow-xs'
                        : 'bg-slate-100/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                        Step 3
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Ambil OTP (Bot Endpoint)</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">GET .../latest-otp</div>
                    </div>
                  </button>

                  {/* Step 4 */}
                  <button
                    onClick={runDeleteMailboxTest}
                    disabled={testLoading || !testMailbox}
                    className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between gap-3 border ${
                      testMailbox
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-800/80 cursor-pointer shadow-xs'
                        : 'bg-slate-100/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-200/80 dark:bg-rose-900 text-rose-800 dark:text-rose-300">
                        Step 4
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-rose-600/10 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Cleanup Mailbox</div>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">DELETE .../:address</div>
                    </div>
                  </button>
                </div>

                {/* Extracted OTP Card */}
                {extractedOtp && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                          OTP Berhasil Ditemukan Otomatis oleh Server!
                        </span>
                        <div className="text-3xl font-mono font-black text-slate-900 dark:text-white tracking-widest mt-0.5">
                          {extractedOtp}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(extractedOtp)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs self-start sm:self-auto shrink-0 border border-emerald-500"
                    >
                      {copiedText === extractedOtp ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                      <span>Salin Kode OTP</span>
                    </button>
                  </div>
                )}

                {/* JSON Result Viewer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0" />
                      <span>Response JSON:</span>
                    </span>
                    {testResultJson && (
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(testResultJson, null, 2))}
                        className="text-[11px] text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Copy className="w-3 h-3 shrink-0" />
                        <span>Copy JSON</span>
                      </button>
                    )}
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 select-all shadow-inner">
                    {testLoading
                      ? 'Loading request...'
                      : testResultJson
                      ? JSON.stringify(testResultJson, null, 2)
                      : '// Klik salah satu tombol di atas untuk menjalankan pengujian'}
                  </pre>
                </div>
              </div>

              {/* Code Generator */}
              <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#0c1229]/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-xl shadow-black/5 dark:shadow-black/25">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Code2 className="w-5 h-5 shrink-0" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Kode Bot Siap Copy-Paste
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Template skrip otomasi yang terkonfigurasi dengan key &amp; domain terpilih.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                    {(['python', 'node', 'telegram', 'curl'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLang(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                          codeLang === lang
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {lang === 'telegram' ? 'Telegram' : lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-80 shadow-inner">
                    {snippets[codeLang]}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(snippets[codeLang])}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    {copiedText === snippets[codeLang] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: DOMAINS MANAGEMENT                                     */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'domains' && (
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#0c1229]/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-6 shadow-xl shadow-black/5 dark:shadow-black/25">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Manajemen Domain Email Aktif
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Domain yang bisa dipilih oleh bot dan pengguna saat membuat mailbox.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddDomain} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="domainbaru.com"
                  className="flex-1 h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="submit"
                  className="h-11 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-cyan-500 shrink-0"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Tambah Domain</span>
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {domains.map((d) => (
                  <div
                    key={d.domain}
                    className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between text-xs shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 shrink-0" />
                      </div>
                      <div>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold block">
                          @{d.domain}
                        </span>
                        {d.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-semibold inline-block mt-0.5">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDomain(d.domain)}
                      className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                      title="Hapus domain"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1 shadow-xs">
                <strong>💡 Catatan Cloudflare:</strong> Pastikan domain di atas sudah diaktifkan <strong>Email Routing</strong> di Cloudflare Dashboard agar email masuk dapat ditangkap oleh Cloudflare Worker.
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 4: SECURITY & CREDENTIALS (GANTI USERNAME & PASSWORD)     */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'security' && (
            <div className="max-w-2xl p-6 rounded-2xl bg-white/80 dark:bg-[#0c1229]/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 space-y-6 shadow-xl shadow-black/5 dark:shadow-black/25">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Ganti Username &amp; Password Admin
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Perbarui kredensial akun login panel admin Anda untuk keamanan sistem.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangeCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password Saat Ini (Wajib):
                  </label>
                  <input
                    type="password"
                    value={credForm.currentPassword}
                    onChange={(e) => setCredForm({ ...credForm, currentPassword: e.target.value })}
                    placeholder="Masukkan password saat ini..."
                    required
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Username Baru (Opsional):
                    </label>
                    <input
                      type="text"
                      value={credForm.newUsername}
                      onChange={(e) => setCredForm({ ...credForm, newUsername: e.target.value })}
                      placeholder="Kosongkan jika tidak ingin ganti"
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Password Baru (Opsional):
                    </label>
                    <input
                      type="password"
                      value={credForm.newPassword}
                      onChange={(e) => setCredForm({ ...credForm, newPassword: e.target.value })}
                      placeholder="Minimal 5 karakter..."
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {credForm.newPassword && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Konfirmasi Password Baru:
                    </label>
                    <input
                      type="password"
                      value={credForm.confirmPassword}
                      onChange={(e) => setCredForm({ ...credForm, confirmPassword: e.target.value })}
                      placeholder="Ulangi password baru..."
                      required
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                )}

                {credMessage && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                      credMessage.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {credMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{credMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer border border-purple-500"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Simpan Kredensial Baru</span>
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4 shrink-0" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Generate API Key Baru
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!createdKey ? (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama / Label Bot:
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="misal: Bot Shopee Auto OTP"
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer flex items-center gap-1.5 border border-blue-500 shadow-xs"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin-custom shrink-0" /> : <Plus className="w-4 h-4 shrink-0" />}
                    <span>Generate Token</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>API Key berhasil dibuat! Salin sekarang dan simpan di bot Anda:</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 select-all break-all shadow-inner">
                  {createdKey.key}
                </div>

                <button
                  onClick={() => copyToClipboard(createdKey.key)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-blue-500"
                >
                  {copiedText === createdKey.key ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                  <span>Salin API Key</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT KEY MODAL */}
      {editKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Edit2 className="w-4 h-4 shrink-0" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Ubah API Key
                </h3>
              </div>
              <button
                onClick={() => setEditKey(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Label:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Kunci:
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="active">Active (Bisa digunakan bot)</option>
                  <option value="inactive">Inactive (Diblokir sementara)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditKey(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer border border-blue-500 shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animated Action Feedback Toast */}
      {toast && (
        <ActionToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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
