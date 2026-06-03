import Link from "next/link";
import { AlertTriangle, BarChart3, Plus, Save, Trash2, WalletCards } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { AuthAlert } from "@/components/states/auth-alert";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { requireOnboardedUser } from "@/lib/auth/session";
import { listBudgets } from "@/lib/repositories/budgets";
import { listCategories } from "@/lib/repositories/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createBudgetAction,
  createBudgetItemAction,
  deleteBudgetAction,
  deleteBudgetItemAction,
  updateBudgetAction,
  updateBudgetItemAction
} from "./actions";

interface BudgetsPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

function formatMoney(value: number | string | null, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();
  const month = currentMonthRange();

  const [{ data: budgets, error: budgetError }, { data: categories, error: categoryError }, { data: settings }] =
    await Promise.all([
      listBudgets(supabase, user.id),
      listCategories(supabase, user.id),
      supabase.from("user_settings").select("currency").eq("user_id", user.id).maybeSingle()
    ]);

  const budgetRows = budgets || [];
  const expenseCategories = (categories || []).filter((category) => category.type === "expense" && !category.is_archived);
  const currency = settings?.currency || "IDR";
  const activeBudgets = budgetRows.length;
  const totalLimit = budgetRows.reduce((total, budget) => total + budget.limit_amount, 0);
  const totalSpent = budgetRows.reduce((total, budget) => total + budget.spent_amount, 0);
  const alertCount = budgetRows.reduce(
    (total, budget) =>
      total + budget.items.filter((item) => item.progress >= Number(item.alert_threshold)).length,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perencana Anggaran"
        description="Atur batas kategori bulanan dan pantau progres dari transaksi pengeluaran nyata."
        actions={
          <Button asChild variant="outline">
            <Link href="/transactions">
              <BarChart3 className="mr-2 h-4 w-4" />
              Transaksi
            </Link>
          </Button>
        }
      />

      <AuthAlert error={params.error || budgetError?.message || categoryError?.message} message={params.message} />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Anggaran" value={String(activeBudgets)} description="Periode aktif" icon={BarChart3} tone="success" />
        <KpiCard
          title="Total rencana"
          value={formatMoney(totalLimit, currency)}
          description={`${formatMoney(totalSpent, currency)} terpakai`}
          icon={WalletCards}
        />
        <KpiCard
          title="Peringatan"
          value={String(alertCount)}
          description="Kategori mencapai ambang batas"
          icon={AlertTriangle}
          tone={alertCount > 0 ? "warning" : "success"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Anggaran baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createBudgetAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget-name">Nama</Label>
                <Input id="budget-name" name="name" placeholder="Anggaran bulanan" maxLength={100} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="period_start">Mulai</Label>
                  <Input id="period_start" name="period_start" type="date" defaultValue={month.start} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_end">Selesai</Label>
                  <Input id="period_end" name="period_end" type="date" defaultValue={month.end} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_limit">Total batas</Label>
                <Input id="total_limit" name="total_limit" type="number" step="0.01" min="0.01" placeholder="Opsional" />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Buat anggaran
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {budgetRows.length === 0 ? (
            <EmptyState
              title="Belum ada anggaran"
              description="Buat anggaran bulanan, lalu tambahkan batas kategori pengeluaran."
              icon={<BarChart3 className="h-5 w-5" />}
            />
          ) : (
            budgetRows.map((budget) => (
              <Card key={budget.id} className="bg-white">
                <CardContent className="space-y-5 p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-950">{budget.name}</h3>
                        <Badge variant={budget.progress >= 100 ? "danger" : budget.progress >= 80 ? "warning" : "success"}>
                          {budget.progress}%
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {budget.period_start} sampai {budget.period_end}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground sm:text-right">
                      <p className="font-semibold text-slate-950">{formatMoney(budget.spent_amount, currency)}</p>
                      <p>dari {formatMoney(budget.limit_amount, currency)}</p>
                    </div>
                  </div>
                  <Progress value={budget.progress} />

                  <form action={updateBudgetAction} className="grid gap-3 lg:grid-cols-12">
                    <input type="hidden" name="id" value={budget.id} />
                    <div className="space-y-1 lg:col-span-4">
                      <Label htmlFor={`budget-name-${budget.id}`}>Nama</Label>
                      <Input id={`budget-name-${budget.id}`} name="name" defaultValue={budget.name} maxLength={100} required />
                    </div>
                    <div className="space-y-1 lg:col-span-3">
                      <Label htmlFor={`budget-start-${budget.id}`}>Mulai</Label>
                      <Input id={`budget-start-${budget.id}`} name="period_start" type="date" defaultValue={budget.period_start} required />
                    </div>
                    <div className="space-y-1 lg:col-span-3">
                      <Label htmlFor={`budget-end-${budget.id}`}>Selesai</Label>
                      <Input id={`budget-end-${budget.id}`} name="period_end" type="date" defaultValue={budget.period_end} required />
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <Label htmlFor={`budget-total-${budget.id}`}>Total</Label>
                      <Input
                        id={`budget-total-${budget.id}`}
                        name="total_limit"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={budget.total_limit ? String(budget.total_limit) : ""}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between gap-3 lg:col-span-12">
                      <Button type="submit" variant="outline">
                        <Save className="mr-2 h-4 w-4" />
                        Simpan anggaran
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">Batas kategori</p>
                      <Badge variant="secondary">{budget.items.length} item</Badge>
                    </div>

                    {budget.items.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-muted-foreground">
                        Tambahkan batas kategori pengeluaran untuk mengaktifkan pelacakan progres.
                      </div>
                    ) : (
                      budget.items.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: item.category?.color || "#059669" }}
                              />
                              <span className="font-medium text-slate-950">{item.category?.name || "Kategori"}</span>
                              {item.progress >= Number(item.alert_threshold) ? <Badge variant="warning">Peringatan</Badge> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatMoney(item.spent_amount, currency)} / {formatMoney(item.limit_amount, currency)}
                            </p>
                          </div>
                          <Progress value={item.progress} />

                          <form action={updateBudgetItemAction} className="mt-4 grid gap-3 lg:grid-cols-12">
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="budget_id" value={budget.id} />
                            <div className="space-y-1 lg:col-span-5">
                              <Label htmlFor={`item-category-${item.id}`}>Kategori</Label>
                              <select
                                id={`item-category-${item.id}`}
                                name="category_id"
                                defaultValue={item.category_id}
                                className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {expenseCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1 lg:col-span-3">
                              <Label htmlFor={`item-limit-${item.id}`}>Batas</Label>
                              <Input id={`item-limit-${item.id}`} name="limit_amount" type="number" step="0.01" min="0.01" defaultValue={String(item.limit_amount)} required />
                            </div>
                            <div className="space-y-1 lg:col-span-2">
                              <Label htmlFor={`item-alert-${item.id}`}>Peringatan %</Label>
                              <Input id={`item-alert-${item.id}`} name="alert_threshold" type="number" step="1" min="1" max="100" defaultValue={String(item.alert_threshold)} required />
                            </div>
                            <div className="flex items-end lg:col-span-2">
                              <Button type="submit" variant="outline" className="w-full">
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          </form>

                          <form action={deleteBudgetItemAction} className="mt-3">
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="budget_id" value={budget.id} />
                            <Button type="submit" variant="destructive" size="sm">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus batas
                            </Button>
                          </form>
                        </div>
                      ))
                    )}

                    <form action={createBudgetItemAction} className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 lg:grid-cols-12">
                      <input type="hidden" name="budget_id" value={budget.id} />
                      <div className="space-y-1 lg:col-span-5">
                        <Label htmlFor={`new-item-category-${budget.id}`}>Kategori pengeluaran</Label>
                        <select
                          id={`new-item-category-${budget.id}`}
                          name="category_id"
                          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        >
                          {expenseCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1 lg:col-span-3">
                        <Label htmlFor={`new-item-limit-${budget.id}`}>Batas</Label>
                        <Input id={`new-item-limit-${budget.id}`} name="limit_amount" type="number" step="0.01" min="0.01" required />
                      </div>
                      <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor={`new-item-alert-${budget.id}`}>Peringatan %</Label>
                        <Input id={`new-item-alert-${budget.id}`} name="alert_threshold" type="number" step="1" min="1" max="100" defaultValue="80" required />
                      </div>
                      <div className="flex items-end lg:col-span-2">
                        <Button type="submit" className="w-full" disabled={expenseCategories.length === 0}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </div>

                  <form action={deleteBudgetAction}>
                    <input type="hidden" name="id" value={budget.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus anggaran
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
