import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finova - Aplikasi Keuangan Pribadi",
  description: "Catat pemasukan, pengeluaran, anggaran, tujuan tabungan, dan laporan dalam satu dashboard keuangan yang rapi."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
