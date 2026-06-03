import Link from "next/link";
import { Archive, Bell, Check, Lightbulb, ShieldCheck } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { AuthAlert } from "@/components/states/auth-alert";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOnboardedUser } from "@/lib/auth/session";
import {
  getRuleBasedInsights,
  listNotifications,
  type InsightRecord,
  type NotificationRecord
} from "@/lib/services/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "./actions";

interface NotificationsPageProps {
  searchParams?: Promise<{ error?: string; message?: string }>;
}

const severityVariant = {
  low: "secondary",
  medium: "warning",
  high: "danger"
} as const;

const insightVariant = {
  success: "success",
  warning: "warning",
  danger: "danger"
} as const;

const severityLabels = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi"
} as const;

const typeLabels: Record<string, string> = {
  budget: "Anggaran",
  goal: "Tujuan",
  bill: "Tagihan",
  subscription: "Langganan",
  security: "Keamanan",
  system: "Sistem"
};

const insightToneLabels = {
  success: "Baik",
  warning: "Perhatian",
  danger: "Penting"
} as const;

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();
  const [{ data: notifications, error }, insights] = await Promise.all([
    listNotifications(supabase, user.id),
    getRuleBasedInsights(supabase, user.id)
  ]);

  const rows = (notifications || []) as NotificationRecord[];
  const unreadCount = rows.filter((item) => !item.is_read).length;
  const highCount = rows.filter((item) => item.severity === "high").length;
  const insightRows = insights as InsightRecord[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi"
        description="Peringatan berbasis aturan untuk anggaran, tujuan, perpanjangan, tagihan, dan kebiasaan keuangan."
        actions={
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline">
              <Check className="mr-2 h-4 w-4" />
              Tandai semua dibaca
            </Button>
          </form>
        }
      />

      <AuthAlert error={params.error || error?.message} message={params.message} />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Belum dibaca" value={String(unreadCount)} description={`${rows.length} peringatan aktif`} icon={Bell} tone={unreadCount > 0 ? "warning" : "success"} />
        <KpiCard title="Prioritas tinggi" value={String(highCount)} description="Butuh perhatian" icon={ShieldCheck} tone={highCount > 0 ? "danger" : "success"} />
        <KpiCard title="Insight" value={String(insightRows.length)} description="Berbasis aturan, tanpa AI" icon={Lightbulb} tone="success" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Pusat notifikasi</h3>
            <Badge variant="success">{rows.length} aktif</Badge>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="Belum ada notifikasi"
              description="Finova akan menampilkan peringatan anggaran, milestone tujuan, tagihan, dan langganan di sini."
              icon={<Bell className="h-5 w-5" />}
            />
          ) : (
            rows.map((notification) => (
              <Card key={notification.id} className={notification.is_read ? "bg-white" : "border-emerald-200 bg-emerald-50/40"}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={severityVariant[notification.severity]}>{severityLabels[notification.severity]}</Badge>
                        <Badge variant="secondary">{typeLabels[notification.type] || notification.type}</Badge>
                        {!notification.is_read ? <Badge variant="success">Belum dibaca</Badge> : null}
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-slate-950">{notification.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p>
                    </div>
                    {notification.action_url ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={notification.action_url}>Buka</Link>
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!notification.is_read ? (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="id" value={notification.id} />
                        <Button type="submit" variant="outline" size="sm">
                          <Check className="mr-2 h-4 w-4" />
                          Tandai dibaca
                        </Button>
                      </form>
                    ) : null}
                    <form action={archiveNotificationAction}>
                      <input type="hidden" name="id" value={notification.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        <Archive className="mr-2 h-4 w-4" />
                        Arsipkan
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-emerald-600" />
              Insight berbasis aturan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insightRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-muted-foreground">
                Belum ada insight yang perlu ditindaklanjuti saat ini.
              </div>
            ) : (
              insightRows.map((insight) => (
                <div key={insight.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Badge variant={insightVariant[insight.tone]}>{insightToneLabels[insight.tone]}</Badge>
                  <h3 className="mt-3 font-semibold text-slate-950">{insight.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{insight.message}</p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href={insight.action_url}>Tinjau</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
