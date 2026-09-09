"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function handleClose(result: boolean) {
    setOptions(null);
    resolveRef.current?.(result);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {options && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 overlay-fade"
          onClick={() => handleClose(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-6 flex flex-col gap-4 modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  options.danger ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{options.title}</h3>
                {options.description && (
                  <p className="text-sm text-muted-foreground mt-1">{options.description}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-1">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                {options.cancelLabel ?? "Batal"}
              </Button>
              <Button
                variant={options.danger ? "destructive" : "default"}
                className="flex-1"
                onClick={() => handleClose(true)}
              >
                {options.confirmLabel ?? "Ya, Lanjutkan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm harus dipakai di dalam ConfirmDialogProvider");
  return ctx;
}
