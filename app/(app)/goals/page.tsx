import Link from "next/link";
import { CalendarDays, CheckCircle2, Plus, Save, Target, Trash2, Trophy } from "lucide-react";
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
import { listSavingsGoals } from "@/lib/repositories/goals";
import { listWallets } from "@/lib/repositories/wallets";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createGoalAction,
  createGoalContributionAction,
  deleteGoalAction,
  deleteGoalContributionAction,
  updateGoalAction
} from "./actions";

interface GoalsPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextYear() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function formatMoney(value: number | string, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value));
}

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();

  const [{ data: goals, error: goalsError }, { data: wallets, error: walletError }, { data: settings }] =
    await Promise.all([
      listSavingsGoals(supabase, user.id),
      listWallets(supabase, user.id),
      supabase.from("user_settings").select("currency").eq("user_id", user.id).maybeSingle()
    ]);

  const goalRows = goals || [];
  const activeWallets = (wallets || []).filter((wallet) => !wallet.is_archived);
  const currency = settings?.currency || activeWallets[0]?.currency || "IDR";
  const activeGoals = goalRows.filter((goal) => goal.status === "active");
  const completedGoals = goalRows.filter((goal) => goal.status === "completed" || goal.progress >= 100);
  const targetTotal = activeGoals.reduce((total, goal) => total + Number(goal.target_amount), 0);
  const contributedTotal = activeGoals.reduce((total, goal) => total + goal.contributed_amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tujuan Tabungan"
        description="Pantau progres target finansial dari riwayat kontribusi nyata."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Target className="mr-2 h-4 w-4" />
              Ringkasan
            </Link>
          </Button>
        }
      />

      <AuthAlert error={params.error || goalsError?.message || walletError?.message} message={params.message} />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Tujuan aktif" value={String(activeGoals.length)} description={`${completedGoals.length} selesai`} icon={Target} tone="success" />
        <KpiCard
          title="Target dana"
          value={formatMoney(targetTotal, currency)}
          description="Hanya tujuan aktif"
          icon={Trophy}
        />
        <KpiCard
          title="Terkumpul"
          value={formatMoney(contributedTotal, currency)}
          description="Hanya tujuan aktif"
          icon={CheckCircle2}
          tone="success"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Tujuan baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createGoalAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Nama</Label>
                <Input id="goal-name" name="name" placeholder="Dana darurat" maxLength={100} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_amount">Target dana</Label>
                <Input id="target_amount" name="target_amount" type="number" step="0.01" min="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_date">Tanggal target</Label>
                <Input id="target_date" name="target_date" type="date" defaultValue={nextYear()} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="goal-color">Warna</Label>
                  <Input id="goal-color" name="color" type="color" defaultValue="#059669" className="p-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-icon">Ikon</Label>
                  <Input id="goal-icon" name="icon" defaultValue="target" maxLength={40} required />
                </div>
              </div>
              <input type="hidden" name="status" value="active" />
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Buat tujuan
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {goalRows.length === 0 ? (
            <EmptyState
              title="Belum ada tujuan tabungan"
              description="Buat target dan mulai pantau kontribusinya."
              icon={<Target className="h-5 w-5" />}
            />
          ) : (
            goalRows.map((goal) => (
              <Card key={goal.id} className="bg-white">
                <CardContent className="space-y-5 p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm"
                        style={{ backgroundColor: goal.color || "#059669" }}
                      >
                        {(goal.icon || goal.name).slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-slate-950">{goal.name}</h3>
                          <Badge variant={goal.status === "completed" || goal.progress >= 100 ? "success" : goal.status === "archived" ? "secondary" : "warning"}>
                            {goal.status === "active" ? "Aktif" : goal.status === "completed" ? "Selesai" : "Diarsipkan"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Target {goal.target_date} - {goal.progress}% selesai
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground sm:text-right">
                      <p className="font-semibold text-slate-950">{formatMoney(goal.contributed_amount, currency)}</p>
                      <p>dari {formatMoney(goal.target_amount, currency)}</p>
                    </div>
                  </div>

                  <Progress value={goal.progress} />

                  <form action={updateGoalAction} className="grid gap-3 lg:grid-cols-12">
                    <input type="hidden" name="id" value={goal.id} />
                    <div className="space-y-1 lg:col-span-3">
                      <Label htmlFor={`goal-name-${goal.id}`}>Nama</Label>
                      <Input id={`goal-name-${goal.id}`} name="name" defaultValue={goal.name} maxLength={100} required />
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <Label htmlFor={`goal-target-${goal.id}`}>Target</Label>
                      <Input id={`goal-target-${goal.id}`} name="target_amount" type="number" step="0.01" min="0.01" defaultValue={String(goal.target_amount)} required />
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <Label htmlFor={`goal-date-${goal.id}`}>Tanggal</Label>
                      <Input id={`goal-date-${goal.id}`} name="target_date" type="date" defaultValue={goal.target_date} required />
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <Label htmlFor={`goal-status-${goal.id}`}>Status</Label>
                      <select
                        id={`goal-status-${goal.id}`}
                        name="status"
                        defaultValue={goal.status}
                        className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="active">Aktif</option>
                        <option value="completed">Selesai</option>
                        <option value="archived">Diarsipkan</option>
                      </select>
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <Label htmlFor={`goal-color-${goal.id}`}>Warna</Label>
                      <Input id={`goal-color-${goal.id}`} name="color" type="color" defaultValue={goal.color || "#059669"} className="p-1" />
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <Label htmlFor={`goal-icon-${goal.id}`}>Ikon</Label>
                      <Input id={`goal-icon-${goal.id}`} name="icon" defaultValue={goal.icon || "target"} maxLength={40} required />
                    </div>
                    <div className="flex justify-end lg:col-span-12">
                      <Button type="submit" variant="outline">
                        <Save className="mr-2 h-4 w-4" />
                        Simpan tujuan
                      </Button>
                    </div>
                  </form>

                  <form action={createGoalContributionAction} className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 lg:grid-cols-12">
                    <input type="hidden" name="goal_id" value={goal.id} />
                    <div className="space-y-1 lg:col-span-3">
                      <Label htmlFor={`goal-contribution-amount-${goal.id}`}>Kontribusi</Label>
                      <Input id={`goal-contribution-amount-${goal.id}`} name="amount" type="number" step="0.01" min="0.01" required />
                    </div>
                    <div className="space-y-1 lg:col-span-3">
                      <Label htmlFor={`goal-contribution-date-${goal.id}`}>Tanggal</Label>
                      <Input id={`goal-contribution-date-${goal.id}`} name="contribution_date" type="date" defaultValue={today()} required />
                    </div>
                    <div className="space-y-1 lg:col-span-3">
                      <Label htmlFor={`goal-contribution-wallet-${goal.id}`}>Dompet</Label>
                      <select
                        id={`goal-contribution-wallet-${goal.id}`}
                        name="wallet_id"
                        className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Tanpa dompet</option>
                        {activeWallets.map((wallet) => (
                          <option key={wallet.id} value={wallet.id}>
                            {wallet.name} - {wallet.currency}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <Label htmlFor={`goal-contribution-notes-${goal.id}`}>Catatan</Label>
                      <Input id={`goal-contribution-notes-${goal.id}`} name="notes" maxLength={500} />
                    </div>
                    <div className="flex items-end lg:col-span-1">
                      <Button type="submit" className="w-full">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">Riwayat kontribusi</p>
                      <Badge variant="secondary">{goal.contributions.length} entri</Badge>
                    </div>
                    {goal.contributions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-muted-foreground">
                        Belum ada kontribusi.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {goal.contributions.slice(0, 6).map((contribution) => (
                          <div key={contribution.id} className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-950">{formatMoney(contribution.amount, contribution.wallet?.currency || currency)}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                                {contribution.contribution_date} - {contribution.wallet?.name || "Tanpa dompet"}
                              </p>
                              {contribution.notes ? <p className="mt-1 text-sm text-muted-foreground">{contribution.notes}</p> : null}
                            </div>
                            <form action={deleteGoalContributionAction}>
                              <input type="hidden" name="id" value={contribution.id} />
                              <input type="hidden" name="goal_id" value={goal.id} />
                              <Button type="submit" variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </Button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form action={deleteGoalAction}>
                    <input type="hidden" name="id" value={goal.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus tujuan
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
