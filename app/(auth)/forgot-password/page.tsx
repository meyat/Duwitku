"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    setStep("otp");
    setResendCooldown(60);
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendCooldown(60);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (loading || otp.length !== 6) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, purpose: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Wrong code");
        setLoading(false);
        return;
      }
      setStep("password");
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      setStep("done");
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground text-xl font-semibold">
          {step === "email" && "Lupa password"}
          {step === "otp" && "Verifikasi email"}
          {step === "password" && "Password baru"}
          {step === "done" && "Berhasil!"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === "email" && "Masukkan email, kami kirim kode OTP"}
          {step === "otp" && `Kode 6 digit sudah dikirim ke ${email} (kalau email terdaftar)`}
          {step === "password" && "Masukkan password baru kamu"}
          {step === "done" && "Password kamu sudah berhasil diubah"}
        </p>
      </CardHeader>
      <CardContent>
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? <Loader2 className="animate-spin" /> : <Mail className="h-4 w-4" />}
              Kirim Kode OTP
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="flex items-center gap-1 text-xs text-muted-foreground w-fit hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Ganti email
            </button>

            <OtpInput value={otp} onChange={setOtp} />

            {error && <p className="text-sm text-danger text-center">{error}</p>}

            <Button type="submit" disabled={loading || otp.length !== 6}>
              {loading && <Loader2 className="animate-spin" />}
              Verifikasi
            </Button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              className="text-xs text-primary font-medium disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Kirim ulang kode (${resendCooldown}s)` : "Kirim ulang kode"}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={loading} className="mt-2">
              {loading && <Loader2 className="animate-spin" />}
              Ubah Password
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-sm text-foreground">Password berhasil diubah. Silakan login dengan password barumu.</p>
            <Button onClick={() => router.push("/login")} className="mt-2">
              Ke Halaman Login
            </Button>
          </div>
        )}

        {step !== "done" && (
          <p className="text-sm text-muted-foreground text-center mt-6">
            <Link href="/login" className="text-primary font-medium hover:underline">
              Kembali ke login
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
