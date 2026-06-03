import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppSidebar() {
  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white/90 px-4 py-6 shadow-sm backdrop-blur lg:sticky lg:top-0 lg:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-slate-50">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-soft">
          F
        </span>
        <div>
          <p className="font-semibold text-slate-950">Finova</p>
          <p className="text-xs text-muted-foreground">Keuangan pribadi</p>
        </div>
      </Link>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <SidebarNav />
      </div>

      <div className="mt-4 shrink-0 space-y-3 border-t border-slate-200 pt-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
            <ShieldCheck className="h-4 w-4" /> Mode aman
          </div>
          <p className="mt-2 text-xs leading-5 text-emerald-800">
            Data Anda dipisahkan per akun dengan sesi Supabase dan kebijakan RLS.
          </p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
