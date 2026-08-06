"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { PwaManager } from "@/components/pwa-manager";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        {children}
        <Toaster richColors position="top-center" />
        <PwaManager />
      </SessionProvider>
    </ThemeProvider>
  );
}
