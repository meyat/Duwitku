import { Resend } from "resend";

// Resend client hanya dibuat kalau API key tersedia, supaya development
// lokal tanpa API key tidak crash (fallback: OTP di-log ke console).
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "Duwitku <onboarding@resend.dev>";
