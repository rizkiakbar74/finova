import Link from "next/link";
import { AlertTriangle, CalendarClock, Plus, Save, Trash2, WalletCards } from "lucide-react";
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
import { listCategories } from "@/lib/repositories/categories";
import { listRecurringBills } from "@/lib/repositories/recurring-bills";
import { listWallets } from "@/lib/repositories/wallets";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createRecurringBillAction, deleteRecurringBillAction, updateRecurringBillAction } from "./actions";

interface RecurringBillsPageProps {
  searchParams?: Promise<{ error?: string; message?: string }>;
}

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatMoney(value: number | string, currency: string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency }).format(Number(value));
}

export default async function RecurringBillsPage({ searchParams }: RecurringBillsPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();
  const [{ data: bills, error: billsError }, { data: wallets }, { data: categories }, { data: settings }] =
    await Promise.all([
      listRecurringBills(supabase, user.id),
      listWallets(supabase, user.id),
      listCategories(supabase, user.id),
      supabase.from("user_settings").select("currency").eq("user_id", user.id).maybeSingle()
    ]);

  const billRows = bills || [];
  const activeWallets = (wallets || []).filter((wallet) => !wallet.is_archived);
  const expenseCategories = (categories || []).filter((category) => category.type === "expense" && !category.is_archived);
  const currency = settings?.currency || activeWallets[0]?.currency || "IDR";
  const activeBills = billRows.filter((bill) => bill.status === "active");
  const overdueBills = billRows.filter((bill) => bill.status === "overdue" || bill.next_due_date < new Date().toISOString().slice(0, 10));
  const monthlyEquivalent = activeBills.reduce((total, bill) => {
    const amount = Number(bill.amount);
    if (bill.frequency === "weekly") return total + amount * 4;
    if (bill.frequency === "yearly") return total + amount / 12;
    return total + amount;
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tagihan Rutin"
        description="Pantau jadwal tagihan, tanggal jatuh tempo, pengingat, dan status pembayaran otomatis."
        actions={
          <Button asChild variant="outline">
            <Link href="/transactions/new">Tambah transaksi</Link>
          </Button>
        }
      />
      <AuthAlert error={params.error || billsError?.message} message={params.message} />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Tagihan aktif" value={String(activeBills.length)} description={`${billRows.length} total`} icon={CalendarClock} tone="success" />
        <KpiCard title="Estimasi bulanan" value={formatMoney(monthlyEquivalent, currency)} description="Jadwal aktif" icon={WalletCards} />
        <KpiCard title="Terlambat" value={String(overdueBills.length)} description="Berdasarkan jatuh tempo/status" icon={AlertTriangle} tone={overdueBills.length > 0 ? "danger" : "success"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="bg-white">
          <CardHeader><CardTitle>Tagihan rutin baru</CardTitle></CardHeader>
          <CardContent>
            <form action={createRecurringBillAction} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="bill-name">Nama</Label><Input id="bill-name" name="name" maxLength={120} required /></div>
              <div className="space-y-2"><Label htmlFor="bill-amount">Jumlah</Label><Input id="bill-amount" name="amount" type="number" step="0.01" min="0.01" required /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frekuensi</Label>
                  <select id="frequency" name="frequency" defaultValue="monthly" className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm">
                    <option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option>
                  </select>
                </div>
                <div className="space-y-2"><Label htmlFor="next_due_date">Jatuh tempo</Label><Input id="next_due_date" name="next_due_date" type="date" defaultValue={todayPlus(7)} required /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Kategori</Label>
                  <select id="category_id" name="category_id" className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm">
                    <option value="">Tanpa kategori</option>
                    {expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet_id">Dompet</Label>
                  <select id="wallet_id" name="wallet_id" className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm">
                    <option value="">Tanpa dompet</option>
                    {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="reminder_days">Hari pengingat</Label><Input id="reminder_days" name="reminder_days" type="number" min="0" defaultValue="3" required /></div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select id="status" name="status" defaultValue="active" className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm">
                    <option value="active">Aktif</option><option value="paused">Dijeda</option><option value="overdue">Terlambat</option>
                  </select>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="auto_pay" className="h-4 w-4 rounded border-slate-300 text-emerald-600" /> Bayar otomatis</label>
              <Button type="submit" className="w-full"><Plus className="mr-2 h-4 w-4" />Buat tagihan</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {billRows.length === 0 ? (
            <EmptyState title="Belum ada tagihan rutin" description="Buat tagihan rutin untuk memantau pembayaran mendatang." icon={<CalendarClock className="h-5 w-5" />} />
          ) : billRows.map((bill) => (
            <Card key={bill.id} className="bg-white">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{bill.name}</h3>
                      <Badge variant={bill.status === "overdue" ? "danger" : bill.status === "paused" ? "secondary" : "success"}>
                        {bill.status === "active" ? "Aktif" : bill.status === "paused" ? "Dijeda" : "Terlambat"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {bill.frequency === "weekly" ? "Mingguan" : bill.frequency === "monthly" ? "Bulanan" : "Tahunan"} - jatuh tempo {bill.next_due_date} - {bill.category?.name || "Tanpa kategori"}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-950">{formatMoney(bill.amount, bill.wallet?.currency || currency)}</p>
                </div>
                <form action={updateRecurringBillAction} className="grid gap-3 lg:grid-cols-12">
                  <input type="hidden" name="id" value={bill.id} />
                  <Input name="name" defaultValue={bill.name} maxLength={120} required className="lg:col-span-3" />
                  <Input name="amount" type="number" step="0.01" min="0.01" defaultValue={String(bill.amount)} required className="lg:col-span-2" />
                  <Input name="next_due_date" type="date" defaultValue={bill.next_due_date} required className="lg:col-span-2" />
                  <select name="frequency" defaultValue={bill.frequency} className="flex h-11 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm lg:col-span-2">
                    <option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option>
                  </select>
                  <select name="status" defaultValue={bill.status} className="flex h-11 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm lg:col-span-2">
                    <option value="active">Aktif</option><option value="paused">Dijeda</option><option value="overdue">Terlambat</option>
                  </select>
                  <Input name="reminder_days" type="number" min="0" defaultValue={String(bill.reminder_days)} required className="lg:col-span-1" />
                  <select name="category_id" defaultValue={bill.category_id || ""} className="flex h-11 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm lg:col-span-4">
                    <option value="">Tanpa kategori</option>{expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  <select name="wallet_id" defaultValue={bill.wallet_id || ""} className="flex h-11 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm lg:col-span-4">
                    <option value="">Tanpa dompet</option>{activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                  </select>
                  <label className="inline-flex items-center gap-2 text-sm lg:col-span-2"><input type="checkbox" name="auto_pay" defaultChecked={bill.auto_pay} className="h-4 w-4 rounded border-slate-300 text-emerald-600" /> Bayar otomatis</label>
                  <Button type="submit" variant="outline" className="lg:col-span-2"><Save className="mr-2 h-4 w-4" />Simpan</Button>
                </form>
                <form action={deleteRecurringBillAction}><input type="hidden" name="id" value={bill.id} /><Button type="submit" variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Hapus</Button></form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
