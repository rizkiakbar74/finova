import { DEFAULT_CURRENCY } from "@/lib/constants/app";

const categoryNameMap: Record<string, string> = {
  salary: "Gaji",
  freelance: "Freelance",
  business: "Bisnis",
  bonus: "Bonus",
  investment: "Investasi",
  "other income": "Pemasukan lain",
  housing: "Rumah",
  "food & dining": "Makan & minum",
  transport: "Transportasi",
  shopping: "Belanja",
  "bills & utilities": "Tagihan & utilitas",
  bills: "Tagihan",
  health: "Kesehatan",
  "health & fitness": "Kesehatan & kebugaran",
  entertainment: "Hiburan",
  education: "Pendidikan",
  other: "Lainnya",
  uncategorized: "Tanpa kategori",
  wallet: "Dompet",
  category: "Kategori"
};

export function displayCurrency() {
  return DEFAULT_CURRENCY;
}

export function formatIdr(value: number | string | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export function localizeCategoryName(name: string | null | undefined) {
  if (!name) return "Kategori";
  return categoryNameMap[name.trim().toLowerCase()] || name;
}
