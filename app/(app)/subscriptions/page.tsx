import Link from "next/link";
import { AlertTriangle, Plus, RefreshCw, Save, Trash2, WalletCards } from "lucide-react";
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
import { listSubscriptions } from "@/lib/repositories/subscriptions";
import { DEFAULT_CURRENCY } from "@/lib/constants/app";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSubscriptionAction, deleteSubscriptionAction, updateSubscriptionAction } from "./actions";

interface SubscriptionsPageProps {
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

export default async function SubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();
  const { data: subscriptions, error } = await listSubscriptions(supabase, user.id);
  const rows = subscriptions || [];
  const currency = DEFAULT_CURRENCY;
  const activeRows = rows.filter((item) => item.status === "active");
  const unusedCount = rows.filter((item) => item.unused_flag).length;
  const monthlyEquivalent = activeRows.reduce((total, item) => {
    const amount = Number(item.amount);
    return total + (item.billing_cycle === "yearly" ? amount / 12 : amount);
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Langganan"
        description="Pantau langganan, tanggal perpanjangan, biaya aktif, dan layanan yang jarang dipakai."
        actions={<Button asChild variant="outline"><Link href="/reports">Laporan</Link></Button>}
      />
      <AuthAlert error={params.error || error?.message} message={params.message} />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Aktif" value={String(activeRows.length)} description={`${rows.length} total langganan`} icon={RefreshCw} tone="success" />
        <KpiCard title="Estimasi bulanan" value={formatMoney(monthlyEquivalent, currency)} description="Langganan aktif" icon={WalletCards} />
        <KpiCard title="Perlu ditinjau" value={String(unusedCount)} description="Ditandai untuk dicek" icon={AlertTriangle} tone={unusedCount > 0 ? "warning" : "success"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="bg-white">
          <CardHeader><CardTitle>Langganan baru</CardTitle></CardHeader>
          <CardContent>
            <form action={createSubscriptionAction} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="sub-name">Nama</Label><Input id="sub-name" name="name" maxLength={120} required /></div>
              <div className="space-y-2"><Label htmlFor="sub-amount">Jumlah</Label><Input id="sub-amount" name="amount" type="number" step="0.01" min="0.01" required /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Siklus</Label>
                  <select id="billing_cycle" name="billing_cycle" defaultValue="monthly" className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm">
                    <option value="monthly">Bulanan</option><option value="yearly">Tahunan</option>
                  </select>
                </div>
                <div className="space-y-2"><Label htmlFor="next_renewal_date">Perpanjangan</Label><Input id="next_renewal_date" name="next_renewal_date" type="date" defaultValue={todayPlus(30)} required /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="sub-category">Kategori</Label><Input id="sub-category" name="category" placeholder="Software, hiburan" maxLength={80} /></div>
              <div className="space-y-2">
                <Label htmlFor="sub-status">Status</Label>
                <select id="sub-status" name="status" defaultValue="active" className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm">
                  <option value="active">Aktif</option><option value="paused">Dijeda</option><option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="auto_renew" defaultChecked className="h-4 w-4 rounded border-slate-300 text-emerald-600" /> Perpanjang otomatis</label>
                <label className="inline-flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="unused_flag" className="h-4 w-4 rounded border-slate-300 text-emerald-600" /> Jarang dipakai</label>
              </div>
              <Button type="submit" className="w-full"><Plus className="mr-2 h-4 w-4" />Buat langganan</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {rows.length === 0 ? (
            <EmptyState title="Belum ada langganan" description="Buat langganan untuk memantau perpanjangan dan biaya rutin." icon={<RefreshCw className="h-5 w-5" />} />
          ) : rows.map((item) => (
            <Card key={item.id} className="bg-white">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{item.name}</h3>
                      <Badge variant={item.status === "active" ? "success" : item.status === "paused" ? "warning" : "secondary"}>
                        {item.status === "active" ? "Aktif" : item.status === "paused" ? "Dijeda" : "Dibatalkan"}
                      </Badge>
                      {item.unused_flag ? <Badge variant="warning">Jarang dipakai</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.billing_cycle === "monthly" ? "Bulanan" : "Tahunan"} - diperpanjang {item.next_renewal_date} - {item.category || "Tanpa kategori"}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-950">{formatMoney(item.amount, currency)}</p>
                </div>
                <form action={updateSubscriptionAction} className="grid gap-3 lg:grid-cols-12">
                  <input type="hidden" name="id" value={item.id} />
                  <Input name="name" defaultValue={item.name} maxLength={120} required className="lg:col-span-3" />
                  <Input name="amount" type="number" step="0.01" min="0.01" defaultValue={String(item.amount)} required className="lg:col-span-2" />
                  <Input name="next_renewal_date" type="date" defaultValue={item.next_renewal_date} required className="lg:col-span-2" />
                  <select name="billing_cycle" defaultValue={item.billing_cycle} className="flex h-11 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm lg:col-span-2">
                    <option value="monthly">Bulanan</option><option value="yearly">Tahunan</option>
                  </select>
                  <select name="status" defaultValue={item.status} className="flex h-11 rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm lg:col-span-2">
                    <option value="active">Aktif</option><option value="paused">Dijeda</option><option value="cancelled">Dibatalkan</option>
                  </select>
                  <Input name="category" defaultValue={item.category || ""} maxLength={80} className="lg:col-span-3" />
                  <label className="inline-flex items-center gap-2 text-sm lg:col-span-2"><input type="checkbox" name="auto_renew" defaultChecked={item.auto_renew} className="h-4 w-4 rounded border-slate-300 text-emerald-600" /> Perpanjang otomatis</label>
                  <label className="inline-flex items-center gap-2 text-sm lg:col-span-2"><input type="checkbox" name="unused_flag" defaultChecked={item.unused_flag} className="h-4 w-4 rounded border-slate-300 text-emerald-600" /> Jarang dipakai</label>
                  <Button type="submit" variant="outline" className="lg:col-span-2"><Save className="mr-2 h-4 w-4" />Simpan</Button>
                </form>
                <form action={deleteSubscriptionAction}><input type="hidden" name="id" value={item.id} /><Button type="submit" variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Hapus</Button></form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
