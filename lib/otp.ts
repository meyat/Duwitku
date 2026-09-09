import { prisma } from "@/lib/prisma";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { otpEmailHtml } from "@/lib/email-templates";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_SEND_PER_HOUR = 3;
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFIED_WINDOW_MINUTES = 30; // berapa lama status verified berlaku setelah verifikasi

export type OtpPurpose = "REGISTER" | "RESET_PASSWORD";

function generateCode(): string {
  return Math.floor(Math.random() * 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export async function checkRateLimit(email: string, purpose: OtpPurpose) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.otpCode.count({
    where: { email, purpose, createdAt: { gte: oneHourAgo } },
  });
  return count < MAX_SEND_PER_HOUR;
}

export async function createAndSendOtp(email: string, purpose: OtpPurpose) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { email: email.toLowerCase(), code, purpose, expiresAt },
  });

  if (resend) {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: purpose === "REGISTER" ? "Kode Verifikasi Duwitku" : "Kode Reset Password Duwitku",
      html: otpEmailHtml(code, purpose),
    });
  } else {
    // Fallback development: log ke console kalau RESEND_API_KEY belum di-set
    console.log(`[DEV OTP] ${email} (${purpose}): ${code}`);
  }
}

export async function verifyOtp(email: string, code: string, purpose: OtpPurpose) {
  const normalizedEmail = email.toLowerCase();

  const otp = await prisma.otpCode.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      verified: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { success: false, error: "Kode tidak ditemukan atau sudah kedaluwarsa. Kirim ulang kode." };
  }

  if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
    return { success: false, error: "Terlalu banyak percobaan salah. Kirim ulang kode." };
  }

  if (otp.code !== code) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { success: false, error: "Kode salah. Coba lagi." };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { verified: true, verifiedAt: new Date() },
  });

  return { success: true };
}

/**
 * Cek apakah email sudah terverifikasi OTP baru-baru ini untuk purpose tertentu.
 * Dipakai saat proses finalisasi (register / reset password) untuk memastikan
 * OTP-nya beneran sudah diverifikasi, bukan langsung nembak endpoint akhir.
 */
export async function hasRecentVerifiedOtp(email: string, purpose: OtpPurpose) {
  const windowStart = new Date(Date.now() - VERIFIED_WINDOW_MINUTES * 60 * 1000);
  const otp = await prisma.otpCode.findFirst({
    where: {
      email: email.toLowerCase(),
      purpose,
      verified: true,
      verifiedAt: { gte: windowStart },
    },
    orderBy: { verifiedAt: "desc" },
  });
  return !!otp;
}
