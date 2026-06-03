export function LoadingSkeleton() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="relative flex h-64 w-full max-w-sm items-center justify-center">
        <div className="absolute h-56 w-56 rounded-full border border-emerald-100 bg-white shadow-soft" />
        <div className="absolute h-44 w-44 animate-[spin_5s_linear_infinite] rounded-full border border-transparent border-r-emerald-200 border-t-emerald-500" />
        <div className="absolute h-32 w-32 animate-[spin_7s_linear_infinite_reverse] rounded-full border border-transparent border-b-slate-900/80 border-l-emerald-300" />
        <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-3xl bg-slate-950 text-white shadow-2xl shadow-emerald-100">
          <span className="text-2xl font-semibold">F</span>
          <span className="mt-1 h-1.5 w-10 overflow-hidden rounded-full bg-white/15">
            <span className="block h-full w-1/2 animate-pulse rounded-full bg-emerald-400" />
          </span>
        </div>
        <div className="absolute bottom-0 text-center">
          <p className="text-sm font-semibold text-slate-950">Memuat Finova</p>
          <p className="mt-1 text-xs text-slate-500">Menyiapkan dashboard keuangan Anda...</p>
        </div>
      </div>
    </div>
  );
}
