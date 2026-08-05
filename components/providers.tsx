"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { PwaManager } from "@/components/pwa-manager";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster richColors position="top-center" />
      <PwaManager />
    </SessionProvider>
  );
}
