"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { PwaManager } from "@/components/pwa-manager";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmDialogProvider } from "@/components/confirm-dialog-provider";
import { CurrencyProvider } from "@/components/currency-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <CurrencyProvider>
          <PwaManager>
            <ConfirmDialogProvider>
              {children}
              <Toaster richColors position="top-center" />
            </ConfirmDialogProvider>
          </PwaManager>
        </CurrencyProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
