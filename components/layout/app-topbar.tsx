"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AppTopbarProps {
  email?: string | null;
  unreadNotificationCount?: number;
}

const pageMeta = [
  { href: "/dashboard", title: "Ringkasan", description: "Gambaran kondisi keuangan pribadi" },
  { href: "/transactions/new", title: "Tambah Transaksi", description: "Form transaksi yang nyaman untuk layar kecil" },
  { href: "/transactions", title: "Transaksi", description: "Catatan pemasukan dan pengeluaran" },
  { href: "/wallets", title: "Dompet", description: "Sumber dana tunai, bank, dan e-wallet" },
  { href: "/budgets", title: "Anggaran", description: "Kontrol belanja bulanan" },
  { href: "/goals", title: "Tujuan", description: "Progres target tabungan" },
  { href: "/reports", title: "Laporan", description: "Analitik dan ekspor data" },
  { href: "/notifications", title: "Notifikasi", description: "Peringatan anggaran, tagihan, tujuan, dan sistem" },
  { href: "/settings", title: "Pengaturan", description: "Profil, preferensi, keamanan, dan privasi" },
  { href: "/income", title: "Pemasukan", description: "Modul pengelolaan pemasukan" },
  { href: "/expenses", title: "Pengeluaran", description: "Modul pengelolaan pengeluaran" },
  { href: "/recurring-bills", title: "Tagihan Rutin", description: "Pelacakan tagihan berulang" },
  { href: "/subscriptions", title: "Langganan", description: "Biaya dan perpanjangan langganan" },
  { href: "/calendar", title: "Kalender", description: "Kalender agenda keuangan" }
];

function getPageMeta(pathname: string) {
  return (
    pageMeta.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? {
      title: "Ruang Kerja Finova",
      description: "Pengelolaan keuangan pribadi"
    }
  );
}

export function AppTopbar({ email, unreadNotificationCount = 0 }: AppTopbarProps) {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-background/85 px-4 py-4 backdrop-blur lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4">
        <div className="min-w-0">
          <Badge variant="success">Sudah masuk</Badge>
          <h1 className="mt-2 truncate text-xl font-semibold text-slate-950">{meta.title}</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">{meta.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button asChild variant="outline" size="icon" aria-label="Notifikasi">
            <Link href="/notifications" className="relative">
              <Bell className="h-4 w-4" />
              {unreadNotificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              ) : null}
            </Link>
          </Button>
          <div className="hidden max-w-[260px] truncate rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm sm:block">
            {email || "Sudah masuk"}
          </div>
        </div>
      </div>
    </header>
  );
}
