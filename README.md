# TMail Bot & Endpoint Engine

Layanan Temporary Email modern berbasis **Vercel**, **Cloudflare Email Workers**, dan **MongoDB Atlas** yang didesain khusus ramah bot automation, QA testing, dan pendaftaran multi-akun.

---

## 🌟 Fitur Utama

1. **Panel Web Admin & Manajemen API (`/admin`)**:
   - **Login dengan Username & Password**: Dilengkapi form login aman berbasis sesi cookie.
     - *Default Username*: `admin`
     - *Default Password*: `admin123`
   - **Bisa Diganti Langsung**: Ubah Username dan Password kapan saja di tab **"Ganti Username & Password"**.
   - **Manajemen API Key Lengkap**: Generate key baru (`tm_live_...`), ubah status/nama label, dan hapus API key.
   - **Interactive Live Tester & Bot Simulator**: Uji coba langsung alur kerja bot dari browser (Create Mailbox → Simulasi Email Masuk → Polling OTP → Cleanup).
   - **Siap Integrasi Bot**: Contoh kode instan untuk Python (`requests`), Node.js (`axios`), Telegram Bot, dan cURL yang otomatis menyematkan API Key aktif Anda.
   - **Manajemen Domain**: Tambah atau hapus domain email yang aktif.

2. **Web Kotak Masuk Konsumen (`/mailbox` & `/`)**:
   - Tampilan antarmuka persis seperti `jans.tmailku.space/mailbox`.
   - Sidebar biru ikonik (`#0155b5`) dengan 4 tombol utama: **Copy**, **Refresh**, **New**, dan **Delete**.
   - Form pembuatan email kustom (Username + Domain + Tombol hijau *Create* `#2fc10a` + Tombol emas *Random* `#d2ab3e`).
   - Auto-refresh realtime setiap 10 detik tanpa reload halaman.
   - Banner kode OTP otomatis dengan tombol salin 1-klik.
   - Deteksi tautan verifikasi/aktivasi akun otomatis.
   - Tombol cepat menuju **Admin Login**.

3. **Cloudflare Email Worker (`cloudflare-worker/`)**:
   - Menangkap semua email masuk (`*@domain.com` catch-all) di Cloudflare tanpa perlu server VPS/cPanel/Postfix.
   - Menggunakan `postal-mime` untuk mem-parsing pengirim, subject, teks, HTML, dan lampiran.
   - Meneruskan payload ke webhook Vercel dalam hitungan milidetik.

4. **MongoDB Atlas Auto-Purge (TTL Index)**:
   - Email dan mailbox lama otomatis terhapus dari database setelah durasi retensi (misal: 60 menit) berakhir, **tanpa perlu cron job**.

---

## 🚀 Cara Menjalankan Lokal

1. **Clone & Install Dependensi**:
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**:
   Salin file `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Isi `MONGODB_URI` dari cluster MongoDB Atlas Anda. *(Catatan: Jika `MONGODB_URI` belum diisi, aplikasi tetap berjalan dengan in-memory database bawaan).*

3. **Jalankan Server**:
   ```bash
   npm run dev
   ```
   Buka di browser:
   - **Web Kotak Masuk**: [http://localhost:3000](http://localhost:3000) atau [http://localhost:3000/mailbox](http://localhost:3000/mailbox)
   - **Panel Admin Login**: [http://localhost:3000/admin](http://localhost:3000/admin) *(Username: `admin`, Password: `admin123`)*

---

## 📡 Dokumentasi Endpoint Khusus Bot

Semua endpoint berikut memerlukan header:
`Authorization: Bearer <API_KEY>` atau `X-API-Key: <API_KEY>`.

### 1. Buat Mailbox Baru
`POST /api/v1/mailbox/create`
```json
// Body (opsional)
{
  "username": "akunbot1", // Kosongkan untuk username acak
  "domain": "oursastore.com" // Kosongkan untuk domain default
}
```

### 2. Ambil Kode OTP Otomatis (One-Call Endpoint)
`GET /api/v1/mailbox/:address/latest-otp`
> Endpoint khusus ini mempermudah bot polling langsung: sistem otomatis mengekstrak kode angka OTP 4–8 digit dari isi email.
```json
{
  "success": true,
  "hasEmail": true,
  "address": "akunbot1@oursastore.com",
  "from": "security@service.com",
  "subject": "Kode Verifikasi Anda adalah 591240",
  "otpCode": "591240",
  "verificationLink": "https://service.com/verify?token=..."
}
```

### 3. Daftar Semua Pesan di Mailbox
`GET /api/v1/mailbox/:address/messages`

### 4. Detail Isi Pesan Lengkap
`GET /api/v1/messages/:id`

### 5. Hapus Mailbox (Pembersihan Setelah Registrasi)
`DELETE /api/v1/mailbox/:address`
