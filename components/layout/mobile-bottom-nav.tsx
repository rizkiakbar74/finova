"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Home, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Ringkasan", icon: Home, exact: true },
  { href: "/transactions", label: "Transaksi", icon: CreditCard },
  { href: "/transactions/new", label: "Tambah", icon: Plus, exact: true, featured: true },
  { href: "/budgets", label: "Anggaran", icon: BarChart3 },
  {
    href: "/settings",
    label: "Lainnya",
    icon: MoreHorizontal,
    match: [
      "/settings",
      "/wallets",
      "/goals",
      "/reports",
      "/notifications",
      "/recurring-bills",
      "/subscriptions",
      "/calendar"
    ]
  }
];

function isActive(pathname: string, href: string, exact?: boolean, match?: string[]) {
  if (match?.some((item) => pathname === item || pathname.startsWith(`${item}/`))) return true;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_34px_rgba(15,23,42,0.1)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href, item.exact, item.match);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-medium text-slate-600 transition sm:text-[11px]",
                item.featured
                  ? "mx-auto -mt-6 h-16 w-16 rounded-full bg-emerald-700 text-white shadow-[0_14px_30px_rgba(5,150,105,0.3)] hover:bg-emerald-800"
                  : active
                    ? "bg-emerald-50 text-emerald-700"
                    : "hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <Icon className={cn("mb-1 h-4 w-4", item.featured && "h-6 w-6")} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
