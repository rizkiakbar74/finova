import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Plus,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { CashflowChart, SpendingCategoryChart } from "@/components/dashboard/dashboard-charts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { AuthAlert } from "@/components/states/auth-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireOnboardedUser } from "@/lib/auth/session";
import { defaultDashboardRange, getDashboardData } from "@/lib/services/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dashboardRangeSchema } from "@/lib/validators/finance.schema";

interface DashboardPageProps {
  searchParams?: Promise<{
    date_from?: string;
    date_to?: string;
    error?: string;
    message?: string;
  }>;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const rangeParsed = dashboardRangeSchema.safeParse(
    params.date_from && params.date_to
      ? { date_from: params.date_from, date_to: params.date_to }
      : defaultDashboardRange()
  );
  const range = rangeParsed.success ? rangeParsed.data : defaultDashboardRange();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await getDashboardData(supabase, user.id, range);
  const dashboard = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ringkasan Keuangan"
        description="Ringkasan pemasukan, pengeluaran, arus kas, dan insight dari transaksi Anda."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/transactions">
                <CreditCard className="mr-2 h-4 w-4" />
                Transaksi
              </Link>
            </Button>
            <Button asChild>
              <Link href="/transactions/new">
                <Plus className="mr-2 h-4 w-4" />
                Tambah
              </Link>
            </Button>
          </>
        }
      />

      <AuthAlert
        error={params.error || (!rangeParsed.success ? "Rentang tanggal tidak valid. Menampilkan bulan berjalan." : undefined) || error || undefined}
        message={params.message}
      />

      <Card className="bg-white">
        <CardContent className="p-5">
          <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" action="/dashboard">
            <div className="space-y-1">
              <Label htmlFor="date_from">Dari</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="date_from" name="date_from" type="date" defaultValue={range.date_from} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="date_to">Sampai</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="date_to" name="date_to" type="date" defaultValue={range.date_to} className="pl-10" required />
              </div>
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline" className="w-full">
                Terapkan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!dashboard ? (
        <EmptyState
          title="Ringkasan tidak dapat dimuat"
          description="Periksa koneksi Supabase lalu coba lagi."
          icon={<LayoutDashboard className="h-5 w-5" />}
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              title="Total saldo"
              value={formatMoney(dashboard.summary.total_balance, dashboard.summary.currency)}
              description={`Mata uang utama: ${dashboard.summary.currency}`}
              icon={WalletCards}
              tone="success"
            />
            <KpiCard
              title="Pemasukan"
              value={formatMoney(dashboard.summary.income, dashboard.summary.currency)}
              description="Transaksi tercatat"
              icon={ArrowUp}
              tone="success"
            />
            <KpiCard
              title="Pengeluaran"
              value={formatMoney(dashboard.summary.expenses, dashboard.summary.currency)}
              description="Transaksi tercatat"
              icon={ArrowDown}
              tone="danger"
            />
            <KpiCard
              title="Arus kas bersih"
              value={formatMoney(dashboard.summary.net_cashflow, dashboard.summary.currency)}
              description="Pemasukan dikurangi pengeluaran"
              icon={TrendingUp}
              tone={dashboard.summary.net_cashflow >= 0 ? "success" : "warning"}
            />
            <KpiCard
              title="Tertunda"
              value={String(dashboard.summary.pending_count)}
              description={`${dashboard.summary.transaction_count} total dalam rentang`}
              icon={CreditCard}
            />
          </section>

          {dashboard.summary.transaction_count === 0 ? (
            <EmptyState
              title="Belum ada transaksi di rentang ini"
              description="Tambahkan pemasukan atau pengeluaran untuk mengisi grafik dashboard."
              actionLabel="Tambah transaksi"
              actionHref="/transactions/new"
              icon={<Plus className="h-5 w-5" />}
            />
          ) : (
            <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Tren arus kas</CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Pemasukan
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        Pengeluaran
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CashflowChart cashflow={dashboard.cashflow} currency={dashboard.summary.currency} />
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Pengeluaran per kategori</CardTitle>
                    <Badge variant="success">{dashboard.spendingByCategory.length} kategori</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <SpendingCategoryChart
                    spendingByCategory={dashboard.spendingByCategory}
                    currency={dashboard.summary.currency}
                  />
                </CardContent>
              </Card>
            </section>
          )}

          <Card className="bg-white">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Transaksi terbaru</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/transactions">Lihat semua</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.recentTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-muted-foreground">
                  Belum ada transaksi terbaru.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {dashboard.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            transaction.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">
                            {transaction.merchant || transaction.category_name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {transaction.transaction_date} - {transaction.wallet_name} - {transaction.category_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                        <Badge variant={transaction.status === "posted" ? "success" : "warning"}>{transaction.status}</Badge>
                        <p
                          className={`mt-0 font-semibold sm:mt-1 ${
                            transaction.type === "income" ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatMoney(transaction.amount, transaction.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
