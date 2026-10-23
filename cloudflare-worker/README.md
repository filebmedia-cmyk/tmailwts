# Panduan Setup Cloudflare Email Worker untuk oursastore.com

Cloudflare Email Routing menangkap semua email yang dikirim ke domain **`*@oursastore.com`** (catch-all) dan memprosesnya secara otomatis menggunakan Worker tanpa perlu server mail cPanel/Postfix/VPS.

---

### Langkah 1: Aktifkan Email Routing di Cloudflare Dashboard
1. Buka dashboard Cloudflare ([dash.cloudflare.com](https://dash.cloudflare.com/)).
2. Pilih domain **oursastore.com**.
3. Di menu sidebar kiri, klik **Email Routing**.
4. Klik tombol **Enable Email Routing**.
5. Cloudflare akan meminta verifikasi DNS: klik tombol **Add records automatically** untuk menambahkan record MX (`route1.mx.cloudflare.net`, `route2...`, `route3...`) dan TXT SPF. Pastikan statusnya menjadi **Active (Configured)**.

---

### Langkah 2: Deploy Worker (Pilih Salah Satu Metode)

#### Cara A: Langsung Copy-Paste via Web Cloudflare (Paling Cepat / Tanpa CLI)
1. Di Cloudflare Dashboard, buka **Workers & Pages** > **Overview** > klik **Create application** > **Create Worker**.
2. Beri nama worker, contoh: `tmail-oursastore-worker`, lalu klik **Deploy**.
3. Setelah terdeploy, klik **Edit code** (Quick Edit).
4. Buka file `worker.bundle.js` di folder ini, **Copy seluruh kodenya**, dan **Paste** menimpa semua kode yang ada di editor Cloudflare.
5. Klik **Save and deploy**.
6. Buka tab **Settings** pada worker tersebut > **Variables and Secrets**:
   - Tambahkan Environment Variable:
     - `WEBHOOK_URL` = `https://oursastore.com/api/webhook/email` *(atau URL Vercel aplikasi Anda jika berbeda)*
     - `WEBHOOK_SECRET` = `tm_whsec_cloudflare_secret_2026`
   - Klik **Save**.

---

#### Cara B: Deploy Menggunakan Wrangler CLI
1. Buka terminal di folder `cloudflare-worker`:
   ```bash
   cd cloudflare-worker
   npm install
   ```
2. Pastikan file `wrangler.toml` sudah sesuai:
   ```toml
   name = "tmail-oursastore-worker"
   main = "worker.js"
   compatibility_date = "2024-04-01"

   [vars]
   WEBHOOK_URL = "https://oursastore.com/api/webhook/email"
   WEBHOOK_SECRET = "tm_whsec_cloudflare_secret_2026"
   ```
3. Deploy ke Cloudflare:
   ```bash
   npx wrangler deploy
   ```

---

### Langkah 3: Hubungkan Catch-All Email Routing ke Worker
1. Kembali ke Cloudflare Dashboard domain **oursastore.com** > menu **Email Routing** > tab **Routing Rules**.
2. Cari bagian **Catch-all address**:
   - Status: Ubah menjadi **Active** (tombol toggle menyala hijau).
   - Action: Pilih **Send to a Worker**.
   - Destination: Pilih worker yang sudah dibuat (**`tmail-oursastore-worker`**).
3. Klik **Save**.

---

🎉 **Selesai!**
Sekarang setiap email yang dikirim ke alamat mana pun seperti `user@oursastore.com`, `admin@oursastore.com`, atau `random123@oursastore.com` akan otomatis diterima oleh Cloudflare Worker, diekstrak kode OTP & link verifikasinya, dan langsung masuk ke database & inbox web TMail Anda!
