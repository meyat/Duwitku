import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <Image src="/logo-mark-128.png" alt="Duwitku" width={64} height={64} />
          <h1 className="text-lg font-semibold text-foreground">Duwitku</h1>
          <p className="text-xs text-muted-foreground -mt-1">Atur Keuangan, Raih Masa Depan</p>
        </div>
        {children}
      </div>
    </div>
  );
}
