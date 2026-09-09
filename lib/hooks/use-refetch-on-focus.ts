"use client";

import { useEffect, useRef } from "react";

/**
 * Panggil ulang `callback` setiap kali halaman ini kembali fokus/visible -
 * misalnya user balik dari app lain, buka lagi PWA-nya, atau switch tab balik.
 * Ini memastikan data (saldo, transaksi, target tabungan, dll) selalu fresh
 * tanpa perlu manual refresh.
 */
export function useRefetchOnFocus(callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        callbackRef.current();
      }
    }
    function handleFocus() {
      callbackRef.current();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
}
