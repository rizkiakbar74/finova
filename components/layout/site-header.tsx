import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white">
            F
          </span>
          <span>Finova</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link href="/" className="hover:text-slate-950">Beranda</Link>
          <Link href="/" className="hover:text-slate-950">Fitur</Link>
          <Link href="/" className="hover:text-slate-950">Harga</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex" asChild><Link href="/login">Masuk</Link></Button>
          <Button asChild><Link href="/signup">Mulai</Link></Button>
        </div>
      </div>
    </header>
  );
}
