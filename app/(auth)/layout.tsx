import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-soft">
            F
          </span>
          Finova
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
    </main>
  );
}
