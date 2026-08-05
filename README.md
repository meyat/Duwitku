# 💰 Personal Finance Tracker

**Aplikasi web buat catat dan atur keuangan pribadi kamu** — mulai dari pemasukan/pengeluaran harian, tagihan bulanan, target nabung, sampai catatan utang-piutang. Semuanya dalam satu tempat, tampilan modern, dan bisa diakses dari HP maupun laptop.

> 📌 Ini bukan aplikasi akuntansi kantor yang ribet. Dibuat sesederhana mungkin buat kebutuhan pribadi sehari-hari.

---

## 🤔 Aplikasi Ini Buat Siapa?

Buat kamu yang mau:
- Berhenti nyatet keuangan pakai kertas atau Excel yang berantakan
- Tau ke mana aja uang kamu pergi tiap bulan
- Punya pengingat biar gak telat bayar tagihan
- Nabung buat tujuan tertentu (beli laptop, liburan, dana darurat, dll) dan bisa pantau progressnya
- Catat siapa yang masih ngutang ke kamu, atau utang kamu ke siapa — lengkap sama cicilannya
- Lihat ringkasan investasi kamu (saham, crypto, emas, dll) dalam satu layar

---

## ✨ Apa Aja yang Bisa Dilakukan Aplikasi Ini?

| Fitur | Penjelasan |
|---|---|
| 📊 **Dashboard** | Ringkasan kondisi keuanganmu — saldo, pemasukan/pengeluaran bulan ini, semuanya kelihatan di satu layar |
| 💸 **Catat Transaksi** | Input pemasukan & pengeluaran, kasih kategori (makan, transport, dll), bisa tambah tag juga |
| 🔍 **Cari & Filter** | Cari transaksi lama dengan cepat, filter berdasarkan tanggal/kategori/nominal |
| 📈 **Statistik** | Grafik yang nunjukin ke mana uangmu paling banyak kepake |
| 🎯 **Target Nabung** | Bikin target (misal "Dana Darurat Rp20 juta"), pantau progressnya sampai tercapai |
| 🧾 **Tagihan** | Catat tagihan rutin (listrik, internet, dll), dapat pengingat sebelum jatuh tempo |
| 🔁 **Transaksi Berulang** | Buat transaksi yang otomatis dicatat tiap bulan (misal gaji, langganan Netflix) |
| 💳 **Utang & Piutang** | Catat siapa yang berutang ke kamu atau sebaliknya, bisa dicicil otomatis atau manual |
| 📉 **Investasi** | Catat aset investasi kamu dan lihat untung/ruginya |
| 📥 **Import/Export** | Bisa import data dari Excel/CSV, atau export data kamu kapan aja |
| 🔔 **Notifikasi** | Diingetin kalau ada tagihan atau cicilan yang mau jatuh tempo |
| 📱 **Bisa Diinstall** | Bisa "diinstall" di HP kayak aplikasi biasa, walau sebenarnya berbasis web |

---

## 🚀 Belum Ngerti Coding? Tetap Bisa Pakai Aplikasi Ini!

Aplikasi ini **sudah selesai dibuat**. Kamu gak perlu bisa coding untuk mulai memakainya — kamu cuma perlu **menerbitkannya** (istilah kerennya: "deploy") supaya bisa diakses lewat internet, kayak website pada umumnya.

**👉 Ikuti panduan step-by-step di sini: [`TUTORIAL-DEPLOY.md`](./TUTORIAL-DEPLOY.md)**

Panduan itu ditulis khusus buat orang yang belum pernah pakai hal-hal teknis sama sekali — semua dijelasin dari nol, cuma modal klik-klik di website, gak perlu buka terminal/command line apapun. Total waktu sekitar 20-30 menit.

---

## 🖼️ Tampilan Aplikasi

Aplikasi ini punya tema gelap modern ala aplikasi fintech, dengan warna hijau sebagai aksen utama. Ada dua cara pakai:
- **Di laptop/komputer**: menu navigasi ada di sisi kiri layar
- **Di HP**: menu navigasi ada di bagian bawah layar, gampang dijangkau jempol

---

## ❓ Pertanyaan yang Sering Muncul

**Q: Aku harus bayar buat pakai ini?**
A: Enggak. Semua layanan yang dipakai (GitHub, Supabase buat database, Vercel buat hosting) punya paket gratis yang cukup buat pemakaian pribadi, gak perlu kartu kredit.

**Q: Datanya aman gak?**
A: Data kamu tersimpan di database pribadi kamu sendiri (bukan dipakai bersama orang lain), password di-enkripsi, dan cuma kamu yang bisa akses data kamu setelah login.

**Q: Kalau aku mau ada fitur tambahan atau ada yang error, gimana?**
A: Karena kamu gak perlu paham coding, kamu bisa lanjut ngobrol sama Claude (AI yang bikinin aplikasi ini) buat minta perubahan atau perbaikan. Tinggal jelasin apa yang kamu mau.

**Q: Bisa dipakai bareng-bareng sama keluarga/pasangan?**
A: Untuk versi ini, tiap orang punya akun dan datanya masing-masing (terpisah). Kalau butuh fitur berbagi data antar akun, itu bisa ditambahkan belakangan.

**Q: Aplikasinya bisa diakses dari mana aja?**
A: Iya, selama ada koneksi internet, kamu bisa buka dari browser HP atau komputer mana pun, gak perlu install apa-apa (walau bisa juga di-"install" biar aksesnya lebih cepat, mirip aplikasi native).

---

## 🛠️ Dibangun Dengan Apa? *(buat yang penasaran aja, gak wajib paham)*

Aplikasi ini dibangun pakai teknologi modern: Next.js, TypeScript, Tailwind CSS, PostgreSQL, dan Prisma. Kalau kamu programmer dan mau ngoprek kodenya sendiri lewat terminal, semua detail teknis (cara instalasi manual, struktur folder, environment variables) ada di [`README-TEKNIS.md`](./README-TEKNIS.md).

---

## 📄 Lisensi

Bebas dipakai dan dimodifikasi untuk keperluan pribadi (MIT License).
