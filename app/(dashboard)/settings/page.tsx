"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Download, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemeMode } from "@/components/theme-provider";

interface Profile {
  name: string;
  email: string;
  currency: string;
  dateFormat: string;
  timezone: string;
  language: string;
  theme: string;
  weekStartsOn: number;
}

interface NotifPrefs {
  browserNotification: boolean;
  billReminder: boolean;
  debtReminder: boolean;
  savingGoalReminder: boolean;
  recurringNotification: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [confirmDeleteData, setConfirmDeleteData] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setName(data.name);
      });
    fetch("/api/settings/notifications")
      .then((res) => res.json())
      .then(setNotifPrefs);
  }, []);

  async function handleSaveProfile() {
    setSavingProfile(true);
    const res = await fetch("/api/settings/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSavingProfile(false);
    if (res.ok) {
      toast.success("Profil berhasil diperbarui");
    } else {
      toast.error("Gagal memperbarui profil");
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("Isi password saat ini dan password baru");
      return;
    }
    setSavingPassword(true);
    const res = await fetch("/api/settings/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSavingPassword(false);
    if (res.ok) {
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      toast.error(data.error ?? "Gagal mengubah password");
    }
  }

  async function updatePreference(key: keyof Profile, value: string | number) {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });

    if (key === "theme") {
      setTheme(value as ThemeMode);
    }

    setSavingPrefs(true);
    await fetch("/api/settings/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setSavingPrefs(false);
    toast.success("Pengaturan diperbarui");
  }

  async function updateNotifPref(key: keyof NotifPrefs, value: boolean) {
    if (!notifPrefs) return;
    setNotifPrefs({ ...notifPrefs, [key]: value });
    await fetch("/api/settings/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  }

  async function handleDeleteAllData() {
    if (!confirmDeleteData) {
      setConfirmDeleteData(true);
      return;
    }
    const res = await fetch("/api/settings/delete-all-data", { method: "POST" });
    if (res.ok) {
      toast.success("Seluruh data berhasil dihapus");
      router.push("/dashboard");
      router.refresh();
    } else {
      toast.error("Gagal menghapus data");
    }
    setConfirmDeleteData(false);
  }

  async function handleDeleteAccount() {
    if (!confirmDeleteAccount) {
      setConfirmDeleteAccount(true);
      return;
    }
    const res = await fetch("/api/settings/delete-account", { method: "POST" });
    if (res.ok) {
      toast.success("Akun berhasil dihapus");
      await signOut({ callbackUrl: "/login" });
    } else {
      toast.error("Gagal menghapus akun");
    }
  }

  if (!profile || !notifPrefs) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="skeleton h-8 w-40 rounded" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola profil dan preferensi aplikasi</p>
      </div>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base font-semibold">Profil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nama</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-fit">
            {savingProfile && <Loader2 className="animate-spin" />} Simpan Profil
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base font-semibold">Ubah Password</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Password Saat Ini</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Password Baru</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword} className="w-fit">
            {savingPassword && <Loader2 className="animate-spin" />} Ubah Password
          </Button>
        </CardContent>
      </Card>

      {/* Preferensi Aplikasi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base font-semibold">Preferensi Aplikasi</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Mata Uang</Label>
              <Select value={profile.currency} onChange={(e) => updatePreference("currency", e.target.value)}>
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SGD">SGD</option>
                <option value="MYR">MYR</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Format Tanggal</Label>
              <Select value={profile.dateFormat} onChange={(e) => updatePreference("dateFormat", e.target.value)}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Tema</Label>
              <Select value={profile.theme} onChange={(e) => updatePreference("theme", e.target.value)}>
                <option value="system">Ikuti Sistem</option>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Hari Pertama Minggu</Label>
              <Select value={String(profile.weekStartsOn)} onChange={(e) => updatePreference("weekStartsOn", parseInt(e.target.value))}>
                <option value="1">Senin</option>
                <option value="0">Minggu</option>
              </Select>
            </div>
          </div>
          {savingPrefs && <p className="text-xs text-muted-foreground">Menyimpan...</p>}
        </CardContent>
      </Card>

      {/* Notifikasi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base font-semibold">Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ToggleRow
            label="Reminder Tagihan"
            checked={notifPrefs.billReminder}
            onChange={(v) => updateNotifPref("billReminder", v)}
          />
          <ToggleRow
            label="Reminder Utang & Piutang"
            checked={notifPrefs.debtReminder}
            onChange={(v) => updateNotifPref("debtReminder", v)}
          />
          <ToggleRow
            label="Reminder Target Tabungan"
            checked={notifPrefs.savingGoalReminder}
            onChange={(v) => updateNotifPref("savingGoalReminder", v)}
          />
          <ToggleRow
            label="Notifikasi Transaksi Berulang"
            checked={notifPrefs.recurringNotification}
            onChange={(v) => updateNotifPref("recurringNotification", v)}
          />
          <ToggleRow
            label="Browser Notification"
            checked={notifPrefs.browserNotification}
            onChange={(v) => updateNotifPref("browserNotification", v)}
          />
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base font-semibold">Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <a href="/api/export?format=csv&scope=all" className="w-fit">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> Export Semua Data (CSV)
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-danger text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Zona Berbahaya
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <Button
              variant={confirmDeleteData ? "destructive" : "outline"}
              size="sm"
              onClick={handleDeleteAllData}
              onBlur={() => setConfirmDeleteData(false)}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDeleteData ? "Klik lagi untuk konfirmasi" : "Hapus Seluruh Data"}
            </Button>
          </div>
          <div>
            <Button
              variant={confirmDeleteAccount ? "destructive" : "outline"}
              size="sm"
              onClick={handleDeleteAccount}
              onBlur={() => setConfirmDeleteAccount(false)}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDeleteAccount ? "Klik lagi untuk konfirmasi" : "Hapus Akun"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 rounded-full transition-colors relative shrink-0 ${checked ? "bg-primary" : "bg-secondary"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </label>
  );
}
