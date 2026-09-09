export function otpEmailHtml(code: string, purpose: "REGISTER" | "RESET_PASSWORD") {
  const title = purpose === "REGISTER" ? "Verifikasi Email Kamu" : "Reset Password";
  const message =
    purpose === "REGISTER"
      ? "Gunakan kode di bawah ini untuk menyelesaikan pendaftaran akun Duwitku kamu."
      : "Gunakan kode di bawah ini untuk mereset password akun Duwitku kamu.";

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f1113; color: #f5f5f6;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; background: #25d366; border-radius: 14px; line-height: 48px; font-weight: bold; font-size: 20px; color: #06120a;">D</div>
    </div>
    <h1 style="font-size: 18px; text-align: center; margin: 0 0 8px;">${title}</h1>
    <p style="font-size: 14px; color: #9ca3af; text-align: center; margin: 0 0 24px;">${message}</p>
    <div style="background: #1a1d21; border: 1px solid #2a2e33; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #25d366;">${code}</span>
    </div>
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      Kode ini berlaku selama 10 menit. Jangan bagikan kode ini ke siapa pun, termasuk pihak yang mengaku dari Duwitku.
    </p>
    <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 24px;">
      Kalau kamu tidak meminta kode ini, abaikan saja email ini.
    </p>
  </div>`;
}

export function backupEmailHtml(userName: string, generatedAt: string) {
  const dateLabel = new Date(generatedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f1113; color: #f5f5f6;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 48px; height: 48px; background: #25d366; border-radius: 14px; line-height: 48px; font-weight: bold; font-size: 20px; color: #06120a;">D</div>
    </div>
    <h1 style="font-size: 18px; text-align: center; margin: 0 0 8px;">Backup Data Duwitku Kamu</h1>
    <p style="font-size: 14px; color: #9ca3af; text-align: center; margin: 0 0 24px;">
      Hai ${userName}, ini backup otomatis 2 mingguan buat akun Duwitku kamu per tanggal ${dateLabel}.
    </p>
    <div style="background: #1a1d21; border: 1px solid #2a2e33; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 13px; color: #d1d5db; margin: 0;">
        File JSON di lampiran email ini berisi semua data akunmu: wallet, kategori, transaksi, target
        tabungan, tagihan, transaksi berulang, utang &amp; piutang, dan investasi. Simpan file ini di
        tempat aman sebagai cadangan kalau sewaktu-waktu dibutuhkan.
      </p>
    </div>
    <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
      Email ini dikirim otomatis setiap 2 minggu. Kalau kamu tidak ingin menerima backup ini lagi,
      hubungi admin aplikasi.
    </p>
  </div>`;
}
