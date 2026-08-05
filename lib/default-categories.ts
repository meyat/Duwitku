export const DEFAULT_CATEGORIES: {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}[] = [
  // Income
  { name: "Gaji", type: "INCOME", icon: "Wallet", color: "#25d366" },
  { name: "Bonus", type: "INCOME", icon: "Gift", color: "#25d366" },
  { name: "Freelance", type: "INCOME", icon: "Laptop", color: "#25d366" },
  { name: "Bisnis", type: "INCOME", icon: "Briefcase", color: "#25d366" },
  { name: "Dividen", type: "INCOME", icon: "TrendingUp", color: "#25d366" },
  { name: "Bunga", type: "INCOME", icon: "Percent", color: "#25d366" },
  { name: "Hadiah", type: "INCOME", icon: "Gift", color: "#25d366" },
  { name: "Lainnya", type: "INCOME", icon: "Circle", color: "#25d366" },

  // Expense
  { name: "Makanan dan Minuman", type: "EXPENSE", icon: "Utensils", color: "#F59E0B" },
  { name: "Transportasi", type: "EXPENSE", icon: "Car", color: "#3B82F6" },
  { name: "Belanja", type: "EXPENSE", icon: "ShoppingBag", color: "#EC4899" },
  { name: "Tagihan", type: "EXPENSE", icon: "Receipt", color: "#EF4444" },
  { name: "Hiburan", type: "EXPENSE", icon: "Film", color: "#8B5CF6" },
  { name: "Kesehatan", type: "EXPENSE", icon: "HeartPulse", color: "#F43F5E" },
  { name: "Pendidikan", type: "EXPENSE", icon: "GraduationCap", color: "#06B6D4" },
  { name: "Rumah", type: "EXPENSE", icon: "Home", color: "#84CC16" },
  { name: "Keluarga", type: "EXPENSE", icon: "Users", color: "#F97316" },
  { name: "Langganan", type: "EXPENSE", icon: "Repeat", color: "#6366F1" },
  { name: "Investasi", type: "EXPENSE", icon: "LineChart", color: "#14B8A6" },
  { name: "Lainnya", type: "EXPENSE", icon: "Circle", color: "#64748B" },
];
