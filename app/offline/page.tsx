import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-lg font-semibold text-foreground">Kamu sedang offline</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Periksa koneksi internetmu. Data yang sudah pernah dimuat sebelumnya masih bisa dilihat, dan
        transaksi baru akan tersinkronisasi begitu koneksi kembali tersedia.
      </p>
    </div>
  );
}
