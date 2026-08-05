# Cara Menerbitkan (Deploy) Aplikasi Personal Finance Tracker
### Panduan untuk yang Belum Pernah Coding Sama Sekali

Halo! Panduan ini dibuat khusus buat kamu yang **bukan programmer** dan belum pernah pakai hal-hal teknis seperti "terminal" atau "command line". Tenang, semuanya di sini dikerjain dengan **klik-klik biasa di website**, sama kayak kamu daftar Instagram atau belanja online.

Waktu yang dibutuhkan: sekitar **20-30 menit** (santai aja, gak perlu buru-buru).

---

## Dulu, Kenalan Dulu Sama Istilah-Istilahnya

Sebelum mulai, biar gak bingung, ini penjelasan singkat istilah yang bakal sering muncul:

| Istilah | Penjelasan Simpelnya |
|---|---|
| **Repository** (atau "repo") | Semacam folder online buat nyimpen kode aplikasi kamu |
| **GitHub** | Website tempat nyimpen "repository" tadi — kayak Google Drive tapi khusus buat kode |
| **Database** | Tempat semua data aplikasi kamu disimpan (transaksi, tagihan, dll) — kayak "gudang data" |
| **Supabase** | Layanan gratis yang nyediain "database" tadi |
| **Deploy** | Proses "menerbitkan" aplikasi supaya bisa diakses lewat internet (dari yang tadinya cuma file di komputer, jadi punya alamat website beneran) |
| **Vercel** | Layanan gratis yang bikin aplikasi kamu bisa "deploy" dan diakses lewat internet |
| **Environment Variable** | Semacam "kata sandi rahasia" yang disimpan aplikasi kamu, biar bisa nyambung ke database dan sistem login |

Gak perlu dihafal, nanti juga ketemu lagi pas prakteknya. Yuk lanjut!

---

## Yang Kamu Butuhkan Sebelum Mulai

1. File **`finance-tracker-no-terminal.zip`** yang sudah kamu download dari chat ini
2. Koneksi internet yang stabil
3. Email aktif (buat daftar akun-akun di bawah)
4. Waktu senggang 20-30 menit tanpa diganggu

Kamu akan bikin 3 akun gratis (gak perlu kartu kredit sama sekali):
- **GitHub** — [daftar di sini](https://github.com/join)
- **Supabase** — [daftar di sini](https://supabase.com/dashboard/sign-up)
- **Vercel** — [daftar di sini](https://vercel.com/signup) (bisa langsung pakai akun GitHub, jadi gak perlu daftar dua kali)

> 💡 Tips: daftar semua akun ini pakai email yang sama, biar gampang diinget.

---

## LANGKAH 1: Buka File Zip yang Sudah Kamu Download

1. Cari file **`finance-tracker-no-terminal.zip`** di folder Downloads komputer kamu
2. **Kalau pakai Windows**: klik kanan file-nya → pilih **"Extract All..."** → klik **"Extract"**
3. **Kalau pakai Mac**: cukup **double-klik** file-nya, otomatis kebuka

Setelah ini, kamu akan punya folder baru bernama **`finance-tracker`**. Di dalamnya ada banyak file — itu normal, itu semua adalah "kode" aplikasinya. Kamu gak perlu buka atau ngerti isinya satu-satu.

---

## LANGKAH 2: Daftar Akun GitHub

GitHub itu tempat kita "nitipin" kode aplikasi supaya nanti bisa diambil sama Vercel (yang akan menerbitkan aplikasinya).

1. Buka [github.com/join](https://github.com/join)
2. Isi email, password, dan username sesuai instruksi di layar
3. Verifikasi email kamu (biasanya GitHub kirim kode ke email)
4. Selesai, kamu sudah punya akun GitHub

---

## LANGKAH 3: Kirim Kode Aplikasi ke GitHub

Ini bagian yang paling "teknis" kelihatannya, tapi tenang — kita pakai aplikasi dengan tombol-tombol biasa, **bukan** tulis-tulis perintah.

### Install GitHub Desktop

1. Buka [desktop.github.com](https://desktop.github.com/)
2. Klik tombol download sesuai komputer kamu (Windows atau Mac)
3. Install seperti install aplikasi biasa (klik Next-Next-Finish)
4. Buka aplikasinya, klik **"Sign in to GitHub.com"**
5. Login pakai akun GitHub yang tadi kamu buat

### Kirim Folder Aplikasi

1. Di GitHub Desktop, klik menu **File** (pojok kiri atas) → **"Add Local Repository"**
2. Klik **"Choose..."**, cari dan pilih folder **`finance-tracker`** yang tadi kamu ekstrak
3. Akan muncul tulisan peringatan kira-kira "folder ini belum jadi repository" — **klik tulisan biru "create a repository"** yang muncul di situ
4. Muncul form kecil, biarkan aja isiannya default, klik **"Create Repository"**
5. Sekarang di kanan atas ada tombol **"Publish repository"** — klik itu
6. Muncul kotak lagi, kamu bisa kasih nama (atau biarkan default), lalu klik **"Publish Repository"**

Tunggu sebentar sampai prosesnya selesai (biasanya cuma beberapa detik). Setelah itu, kode aplikasi kamu sudah "nyimpen" di GitHub.

**Cara ceknya**: buka [github.com](https://github.com), login, kamu akan lihat repository baru bernama `finance-tracker` di halaman utama kamu.

---

## LANGKAH 4: Bikin Database (Tempat Nyimpen Data)

Database itu wajib ada supaya aplikasi bisa nyimpen transaksi, tagihan, dan data lain yang kamu input nanti. Kita pakai **Supabase**, gratis dan gak perlu kartu kredit.

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard), login/daftar
2. Klik tombol hijau **"New Project"**
3. Isi form yang muncul:
   - **Name**: bebas, misalnya ketik `finance-tracker`
   - **Database Password**: **bikin password yang kuat** (campuran huruf besar-kecil-angka), lalu **catat/simpan di notes HP kamu** — ini penting banget dan susah dilihat lagi nanti
   - **Region**: pilih yang lokasinya paling dekat, misalnya `Southeast Asia (Singapore)`
4. Klik **"Create new project"**
5. Tunggu 1-2 menit (ada animasi loading), sampai muncul halaman dashboard project kamu

### Ambil "Kode Sambungan" Database

1. Di sidebar kiri, cari dan klik ikon **gerigi ⚙️ (Settings)** di bagian paling bawah
2. Klik menu **"Database"**
3. Scroll ke bawah sampai ketemu bagian **"Connection string"**
4. Ada beberapa pilihan tab, klik tab **"Transaction"**
5. Kamu akan lihat teks panjang yang formatnya kira-kira begini:
   ```
   postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
6. Klik ikon copy di sebelahnya buat nyalin teks ini
7. **Tempel teks ini di Notes HP/komputer kamu**, lalu **ganti tulisan `[YOUR-PASSWORD]`** dengan password yang kamu buat di langkah sebelumnya

Jadi hasil akhirnya kira-kira:
```
postgresql://postgres.abcdefghijk:PasswordSayaTadi123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**Simpan baik-baik teks ini**, kamu akan pakai di langkah berikutnya.

---

## LANGKAH 5: Terbitkan Aplikasi Lewat Vercel

Ini langkah utamanya — mengubah kode yang tadi disimpan di GitHub menjadi **website beneran** yang bisa diakses siapa saja.

1. Buka [vercel.com/new](https://vercel.com/new)
2. Login pakai akun GitHub kamu (klik **"Continue with GitHub"**)
3. Kalau diminta izin akses, klik **"Authorize"**
4. Kamu akan lihat daftar repository — cari **`finance-tracker`**, klik tombol **"Import"** di sebelahnya
5. Muncul halaman pengaturan. **Jangan klik Deploy dulu!** Kita perlu isi beberapa "kata sandi rahasia" dulu

### Isi Environment Variables (Kata Sandi Rahasia Aplikasi)

Di halaman yang sama, cari bagian **"Environment Variables"** (biasanya perlu klik untuk membuka/expand).

Kamu akan isi 4 baris. Caranya: ketik nama di kolom **Key**, ketik isinya di kolom **Value**, lalu klik **Add**. Ulangi untuk masing-masing baris di bawah ini:

**Baris 1:**
- Key: `DATABASE_URL`
- Value: teks connection string yang kamu simpan di Langkah 4 tadi

**Baris 2:**
- Key: `NEXTAUTH_URL`
- Value: `https://placeholder.vercel.app` *(nanti kita perbaiki di Langkah 7, sekarang isi asal dulu gapapa)*

**Baris 3:**
- Key: `NEXTAUTH_SECRET`
- Value: buka tab baru di browser, kunjungi [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32), copy teks acak yang muncul, tempel di sini

**Baris 4 (opsional, tapi disarankan):**
- Key: `SEED_SECRET`
- Value: ketik kata bebas, contoh: `rahasia123` *(ini nanti dipakai buat isi contoh data di Langkah 8)*

### Klik Deploy

Setelah 4 baris di atas terisi, scroll ke bawah, klik tombol besar **"Deploy"**.

Sekarang **tunggu 2-5 menit**. Kamu akan lihat log/catatan proses berjalan di layar — itu normal, itu tandanya sistem lagi menyiapkan aplikasi kamu secara otomatis (install semua yang dibutuhkan, menyiapkan database, dan membangun tampilan aplikasi). **Kamu gak perlu melakukan apa-apa, cukup tunggu.**

Kalau berhasil, akan muncul tulisan besar **"Congratulations!"** dengan animasi confetti/kembang api. Itu tandanya aplikasi kamu sudah live di internet! 🎉

---

## LANGKAH 6: Cek Alamat Website Kamu

1. Di halaman "Congratulations" tadi, kamu akan lihat gambar preview aplikasi kamu
2. Di atasnya ada alamat website, formatnya kira-kira: `finance-tracker-xxxxx.vercel.app`
3. **Catat alamat ini**, kamu akan butuh di langkah selanjutnya

---

## LANGKAH 7: Perbaiki Pengaturan Login

Ini langkah penting supaya fitur login di aplikasi kamu berfungsi dengan benar (soalnya di Langkah 5 kita isi alamat asal-asalan dulu).

1. Di halaman Vercel, klik tab **"Settings"** (ada di menu atas)
2. Di sidebar kiri, klik **"Environment Variables"**
3. Cari baris **`NEXTAUTH_URL`**, klik ikon titik tiga (⋯) atau pensil di sampingnya, pilih **Edit**
4. Ganti isinya dengan alamat website kamu dari Langkah 6, formatnya:
   ```
   https://finance-tracker-xxxxx.vercel.app
   ```
   (pastikan ada `https://` di depannya, dan **tanpa** tanda `/` di akhir)
5. Klik **"Save"**
6. Klik tab **"Deployments"** (menu atas)
7. Di baris paling atas (deployment terbaru), klik ikon titik tiga (⋯) di ujung kanan
8. Klik **"Redeploy"**
9. Muncul kotak konfirmasi, klik **"Redeploy"** lagi
10. Tunggu 1-2 menit sampai selesai

---

## LANGKAH 8: (Opsional) Isi Contoh Data

Kalau kamu mau lihat aplikasi udah keisi data contoh (biar gak bingung liat aplikasi kosong), lakukan ini. Kalau enggak, boleh skip ke Langkah 9.

1. Buka browser, ketik alamat website kamu, tambahkan di belakangnya: `/api/dev-seed?secret=` lalu diikuti kata sandi yang kamu isi di **Baris 4 (SEED_SECRET)** tadi

   Contoh lengkap:
   ```
   https://finance-tracker-xxxxx.vercel.app/api/dev-seed?secret=rahasia123
   ```
2. Tekan Enter
3. Kalau berhasil, akan muncul tulisan (mungkin terlihat seperti kode, itu normal) yang isinya kira-kira konfirmasi berhasil, beserta:
   - Email: `demo@financetracker.com`
   - Password: `password123`

Simpan email & password ini buat login nanti.

---

## LANGKAH 9: Buka Aplikasi Kamu!

1. Buka alamat website kamu di browser (dari Langkah 6)
2. Kamu akan diarahkan ke halaman **Login**
3. Kalau tadi isi data contoh di Langkah 8, login pakai:
   - Email: `demo@financetracker.com`
   - Password: `password123`
4. Kalau enggak, klik **"Daftar"** dan bikin akun baru pakai email kamu sendiri

**Selamat! Aplikasi Personal Finance Tracker kamu sudah live dan bisa diakses dari HP atau komputer mana saja.** 🎉

---

## Kalau Ada Masalah

**"Muncul error pas Deploy, katanya soal database"**
→ Balik ke Vercel → Settings → Environment Variables → cek lagi `DATABASE_URL`. Pastikan kamu udah ganti tulisan `[YOUR-PASSWORD]` dengan password beneran, jangan sampai kelupaan.

**"Aku login tapi langsung balik lagi ke halaman login"**
→ Ini biasanya karena Langkah 7 (perbaiki NEXTAUTH_URL) belum dilakukan atau redeploy belum selesai. Ulangi Langkah 7 dengan teliti.

**"Aku lupa/salah tulis password Supabase"**
→ Buka Supabase → project kamu → Settings → Database → ada tombol **"Reset database password"**. Setelah reset, kamu perlu update lagi `DATABASE_URL` di Vercel dengan password baru.

**"Aku mau ubah-ubah tampilan/fitur lagi nanti"**
→ Karena kamu bukan programmer, cara termudah adalah tanya lagi ke Claude, minta dibuatkan perubahannya, lalu minta juga dituntun cara update kode di GitHub Desktop (biasanya cukup buka aplikasinya, klik "Commit to main", lalu "Push origin" — Vercel otomatis update sendiri setelah itu).

**"Masih bingung/stuck, gak ngerti harus ngapain"**
→ Gapapa banget, wajar! Screenshot bagian yang bikin bingung, terus tanya lagi ke Claude sambil bilang kamu stuck di Langkah berapa.

---

## Istilah yang Mungkin Kamu Temuin Lagi Nanti

- **Redeploy** = menerbitkan ulang aplikasi (biasanya setelah ada perubahan kode atau pengaturan)
- **Commit** = "menyimpan" perubahan kode sebelum dikirim ke GitHub
- **Push** = mengirim perubahan kode dari komputer kamu ke GitHub
- **Domain** = alamat website (contoh: `finance-tracker-xxxxx.vercel.app`)

Selamat, kamu baru aja belajar dan berhasil deploy aplikasi web pertamamu tanpa nulis kode sama sekali! 👏
