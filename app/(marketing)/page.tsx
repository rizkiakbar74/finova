import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, WalletCards } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Total Saldo", value: "Rp428 jt", tone: "text-emerald-600" },
  { label: "Pemasukan Bulanan", value: "Rp103 jt", tone: "text-slate-900" },
  { label: "Pengeluaran Bulanan", value: "Rp68 jt", tone: "text-rose-500" }
];

const features = [
  {
    icon: WalletCards,
    title: "Pencatatan Manual",
    description: "Catat pemasukan, pengeluaran, dompet, dan kategori tanpa menghubungkan rekening bank."
  },
  {
    icon: BarChart3,
    title: "Ringkasan Keuangan",
    description: "Pantau saldo, arus kas, anggaran, dan kategori pengeluaran dalam satu tampilan."
  },
  {
    icon: ShieldCheck,
    title: "Privasi Sejak Awal",
    description: "Dirancang dengan Supabase Auth dan Row Level Security agar data tiap akun tetap terpisah."
  }
];

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_36%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <SiteHeader />

      <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-[1.02fr_0.98fr] md:py-28 lg:px-8">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            Ringkasan keuangan pribadi yang rapi dan aman
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Kendalikan pemasukan, pengeluaran, anggaran, dan tujuan tabungan.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Finova membantu Anda mencatat keuangan secara manual, memahami arus kas, mengendalikan pengeluaran, dan membangun kebiasaan menabung.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/signup">Mulai sekarang <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Masuk ke dashboard</Link>
            </Button>
          </div>
        </div>

        <Card className="relative border-slate-200 bg-white/90 shadow-soft backdrop-blur">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pratinjau Ringkasan</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Ringkasan keuangan dalam Rupiah</p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Finova
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className={`mt-2 text-xl font-semibold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Tren Arus Kas</p>
                <p className="text-xs text-slate-500">Visual contoh</p>
              </div>
              <div className="flex h-44 items-end gap-3">
                {[40, 66, 52, 78, 58, 86, 72, 92].map((height, index) => (
                  <div key={index} className="flex flex-1 items-end rounded-full bg-emerald-100">
                    <div className="w-full rounded-full bg-emerald-500" style={{ height: `${height}%` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-slate-100 p-4">
                  <feature.icon className="h-5 w-5 text-emerald-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">{feature.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
