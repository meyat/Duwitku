import { Landmark, Wallet as WalletIcon, Smartphone, CreditCard, CircleDollarSign } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const WALLET_TYPE_LABEL: Record<string, string> = {
  BANK: "Bank",
  CASH: "Tunai",
  E_WALLET: "E-Wallet",
  CREDIT_CARD: "Kartu Kredit",
  OTHER: "Lainnya",
};

export const WALLET_TYPE_ICON: Record<string, LucideIcon> = {
  BANK: Landmark,
  CASH: WalletIcon,
  E_WALLET: Smartphone,
  CREDIT_CARD: CreditCard,
  OTHER: CircleDollarSign,
};
