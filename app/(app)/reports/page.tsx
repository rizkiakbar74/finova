import Link from "next/link";
import { ArrowDown, ArrowUp, Download, FileText, LineChart, WalletCards } from "lucide-react";
import { CashflowChart, SpendingCategoryChart } from "@/components/dashboard/dashboard-charts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { AuthAlert } from "@/components/states/auth-alert";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireOnboardedUser } from "@/lib/auth/session";
import { defaultDashboardRange, getDashboardData } from "@/lib/services/dashboard";
import { listReportExports, type ReportExportRecord } from "@/lib/services/reports";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dashboardRangeSchema } from "@/lib/validators/finance.schema";

interface ReportsPageProps {
  searchParams?: Promise<{
    date_from?: string;
    date_to?: string;
    error?: string;
    message?: string;
  }>;
}

const reportTypes = [
  { value: "monthly_summary", label: "Ringkasan bulanan" },
  { value: "spending_by_category", label: "Pengeluaran per kategori" },
  { value: "cashflow", label: "Arus kas" },
  { value: "savings_progress", label: "Progres tabungan" }
];

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const rangeParsed = dashboardRangeSchema.safeParse(
    params.date_from && params.date_to
      ? { date_from: params.date_from, date_to: params.date_to }
      : defaultDashboardRange()
  );
  const range = rangeParsed.success ? rangeParsed.data : defaultDashboardRange();
  const supabase = await createSupabaseServerClient();

  const [{ data: dashboard, error: dashboardError }, { data: exports, error: exportsError }] = await Promise.all([
    getDashboardData(supabase, user.id, range),
    listReportExports(supabase, user.id)
  ]);

  const exportRows = (exports || []) as ReportExportRecord[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Tinjau arus kas, rincian pengeluaran, dan ekspor CSV dari data keuangan nyata."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <LineChart className="mr-2 h-4 w-4" />
              Ringkasan
            </Link>
          </Button>
        }
      />

      <AuthAlert
        error={params.error || (!rangeParsed.success ? "Rentang tanggal tidak valid. Menampilkan bulan berjalan." : undefined) || dashboardError || exportsError?.message}
        message={params.message}
      />

      <Card className="bg-white">
        <CardContent className="p-5">
          <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" action="/reports">
            <div className="space-y-1">
              <Label htmlFor="date_from">Dari</Label>
              <Input id="date_from" name="date_from" type="date" defaultValue={range.date_from} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date_to">Sampai</Label>
              <Input id="date_to" name="date_to" type="date" defaultValue={range.date_to} required />
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
          title="Laporan tidak dapat dimuat"
          description="Periksa koneksi Supabase lalu coba lagi."
          icon={<FileText className="h-5 w-5" />}
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
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
              description={`${range.date_from} sampai ${range.date_to}`}
              icon={LineChart}
              tone={dashboard.summary.net_cashflow >= 0 ? "success" : "warning"}
            />
            <KpiCard
              title="Transaksi"
              value={String(dashboard.summary.transaction_count)}
              description={`${dashboard.summary.pending_count} tertunda`}
              icon={WalletCards}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Laporan arus kas</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.summary.transaction_count === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-muted-foreground">
                    Belum ada transaksi pada rentang ini.
                  </div>
                ) : (
                  <CashflowChart cashflow={dashboard.cashflow} currency={dashboard.summary.currency} />
                )}
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Laporan pengeluaran</CardTitle>
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

          <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Export CSV</CardTitle>
              </CardHeader>
              <CardContent>
                <form action="/api/reports/export" method="post" className="space-y-4">
                  <input type="hidden" name="export_format" value="csv" />
                  <input type="hidden" name="date_from" value={range.date_from} />
                  <input type="hidden" name="date_to" value={range.date_to} />
                  <div className="space-y-2">
                    <Label htmlFor="report_type">Jenis laporan</Label>
                    <select
                      id="report_type"
                      name="report_type"
                      className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {reportTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh CSV
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Riwayat export</CardTitle>
                  <Badge variant="secondary">{exportRows.length} terbaru</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {exportRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada export laporan.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {exportRows.map((item) => (
                      <div key={item.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950">
                            {reportTypes.find((type) => type.value === item.report_type)?.label || item.report_type}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.date_from} sampai {item.date_to} - {item.export_format.toUpperCase()}
                          </p>
                          {item.error_message ? <p className="mt-1 text-sm text-red-600">{item.error_message}</p> : null}
                        </div>
                        <Badge variant={item.status === "completed" ? "success" : item.status === "failed" ? "danger" : "warning"}>
                          {item.status === "completed" ? "Selesai" : item.status === "failed" ? "Gagal" : "Diproses"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
