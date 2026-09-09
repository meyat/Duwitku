"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";

type Step = "email" | "otp" | "details";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
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

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "REGISTER" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      setStep("otp");
      setResendCooldown(60);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setError(null);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "REGISTER" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to resend code");
      return;
    }
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
        body: JSON.stringify({ email, code: otp, purpose: "REGISTER" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Wrong code");
        setLoading(false);
        return;
      }
      setStep("details");
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  async function handleFinishRegister(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);

      if (result?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground text-xl font-semibold">
          {step === "email" && "Buat akun baru"}
          {step === "otp" && "Verifikasi email"}
          {step === "details" && "Lengkapi profil"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === "email" && "Mulai kelola keuangan pribadimu"}
          {step === "otp" && `Kode 6 digit sudah dikirim ke ${email}`}
          {step === "details" && "Email terverifikasi, satu langkah lagi"}
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

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? <Loader2 className="animate-spin" /> : <Mail className="h-4 w-4" />}
              Kirim Kode Verifikasi
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

        {step === "details" && (
          <form onSubmit={handleFinishRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
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
              Selesaikan Pendaftaran
            </Button>
          </form>
        )}

        <p className="text-sm text-muted-foreground text-center mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
