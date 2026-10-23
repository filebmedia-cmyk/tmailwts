# Panduan Setup Cloudflare Email Worker (Gratis & Cepat)

Cloudflare Email Routing memungkinkan Anda menangkap semua email yang dikirim ke domain Anda (`*@domainanda.com`) dan memprosesnya secara otomatis menggunakan Worker tanpa perlu server mail cPanel/Postfix.

---

### Langkah 1: Aktifkan Email Routing di Cloudflare Dashboard
1. Buka dashboard Cloudflare di domain Anda (misal `tmailku.space`).
2. Masuk ke menu **Email Routing** di sidebar kiri.
3. Klik tombol **Enable Email Routing**.
4. Cloudflare akan otomatis menambahkan record DNS MX (`route1.mx.cloudflare.net`, dst) dan TXT SPF ke domain Anda.

---

### Langkah 2: Deploy Worker
1. Masuk ke folder ini lewat terminal:
   ```bash
   cd cloudflare-worker
   npm install
   ```
2. Ubah `WEBHOOK_URL` di file `wrangler.toml` dengan URL deployment Vercel Anda:
   ```toml
   [vars]
   WEBHOOK_URL = "https://domain-anda.vercel.app/api/webhook/email"
   WEBHOOK_SECRET = "tm_whsec_cloudflare_secret_2026"
   ```
3. Deploy ke Cloudflare:
   ```bash
   npx wrangler deploy
   ```

---

### Langkah 3: Sambungkan Routing Rule ke Worker
1. Di Cloudflare Dashboard domain Anda, buka **Email Routing** > tab **Routing Rules**.
2. Di bagian **Catch-all address**:
   - Status: **Active**
   - Action: Pilih **Send to a Worker**
   - Destination: Pilih worker yang baru saja Anda deploy (`tmail-email-worker`).
3. Klik **Save**.

🎉 **Selesai!** Sekarang setiap email yang dikirim ke alamat apa pun di domain Anda (misal: `apapun@domainanda.com`) akan otomatis diproses oleh Cloudflare Worker, diekstrak kode OTP-nya, dan langsung masuk ke database MongoDB / Webhook Vercel dalam hitungan milidetik.
