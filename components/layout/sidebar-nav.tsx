"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  Home,
  LineChart,
  Repeat,
  Settings,
  Target,
  WalletCards
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", label: "Ringkasan", icon: Home, exact: true },
      { href: "/transactions", label: "Transaksi", icon: CreditCard },
      { href: "/wallets", label: "Dompet", icon: WalletCards },
      { href: "/budgets", label: "Anggaran", icon: BarChart3 },
      { href: "/goals", label: "Tujuan", icon: Target },
      { href: "/reports", label: "Laporan", icon: LineChart }
    ]
  },
  {
    label: "Perencanaan",
    items: [
      { href: "/recurring-bills", label: "Tagihan Rutin", icon: Repeat },
      { href: "/subscriptions", label: "Langganan", icon: CreditCard },
      { href: "/calendar", label: "Kalender", icon: CalendarDays }
    ]
  },
  {
    label: "Sistem",
    items: [
      { href: "/notifications", label: "Notifikasi", icon: Bell },
      { href: "/settings", label: "Pengaturan", icon: Settings }
    ]
  }
];

function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {navSections.map((section) => (
        <div key={section.label} className="space-y-1.5">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {section.label}
          </p>

          {section.items.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-slate-100 text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-emerald-700" : "text-slate-500 group-hover:text-slate-700"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
