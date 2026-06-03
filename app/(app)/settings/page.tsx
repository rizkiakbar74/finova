import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CreditCard,
  Globe2,
  LineChart,
  Moon,
  Palette,
  Repeat,
  Save,
  Settings,
  Target,
  UserRound,
  WalletCards
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AuthAlert } from "@/components/states/auth-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireOnboardedUser } from "@/lib/auth/session";
import { getUserSettings } from "@/lib/services/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateSettingsAction } from "./actions";

interface SettingsPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}

const moreLinks = [
  { href: "/wallets", label: "Dompet", icon: WalletCards },
  { href: "/goals", label: "Tujuan", icon: Target },
  { href: "/reports", label: "Laporan", icon: LineChart },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
  { href: "/recurring-bills", label: "Tagihan Rutin", icon: Repeat },
  { href: "/subscriptions", label: "Langganan", icon: CreditCard },
  { href: "/calendar", label: "Kalender", icon: CalendarDays }
];

const currencies = ["IDR"];

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();
  const { data, error } = await getUserSettings(supabase, user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil, preferensi aplikasi, dan aturan notifikasi Finova."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Settings className="mr-2 h-4 w-4" />
              Ringkasan
            </Link>
          </Button>
        }
      />

      <AuthAlert error={params.error || error || undefined} message={params.message} />

      {data ? (
        <form action={updateSettingsAction} className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-emerald-600" />
                    Profil
                  </CardTitle>
                  <Badge variant="success">{data.profile.plan_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama lengkap</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={data.profile.full_name || ""}
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">URL avatar</Label>
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    defaultValue={data.profile.avatar_url || ""}
                    type="url"
                    placeholder="https://..."
                    maxLength={500}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground">
                  Masuk sebagai <span className="font-medium text-slate-950">{user.email}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-emerald-600" />
                  Preferensi
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Mata uang</Label>
                  <select
                    id="currency"
                    name="currency"
                    defaultValue={data.settings.currency}
                    className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Bahasa</Label>
                  <select
                    id="language"
                    name="language"
                    defaultValue={data.settings.language}
                    className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="id">Bahasa Indonesia</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <select
                    id="theme"
                    name="theme"
                    defaultValue={data.settings.theme}
                    className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="light">Terang</option>
                    <option value="dark">Gelap</option>
                    <option value="system">Ikuti sistem</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_format">Format tanggal</Label>
                  <select
                    id="date_format"
                    name="date_format"
                    defaultValue={data.settings.date_format || "YYYY-MM-DD"}
                    className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="timezone">Zona waktu</Label>
                  <Input id="timezone" name="timezone" defaultValue={data.settings.timezone || "Asia/Jakarta"} maxLength={80} required />
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-600" />
                Notifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["budget_alerts", "Peringatan anggaran"],
                  ["bill_reminders", "Pengingat tagihan"],
                  ["goal_milestones", "Milestone tujuan"],
                  ["subscription_renewals", "Perpanjangan langganan"],
                  ["security_alerts", "Peringatan keamanan"]
                ].map(([name, label]) => (
                  <label key={name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                    {label}
                    <input
                      type="checkbox"
                      name={name}
                      defaultChecked={Boolean(data.notifications[name as keyof typeof data.notifications])}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                  </label>
                ))}
              </div>

              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_1fr]">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="quiet_hours_enabled"
                    defaultChecked={data.notifications.quiet_hours_enabled}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <Moon className="h-4 w-4" />
                  Jam senyap
                </label>
                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_start">Mulai</Label>
                  <Input
                    id="quiet_hours_start"
                    name="quiet_hours_start"
                    type="time"
                    defaultValue={data.notifications.quiet_hours_start?.slice(0, 5) || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_end">Selesai</Label>
                  <Input
                    id="quiet_hours_end"
                    name="quiet_hours_end"
                    type="time"
                    defaultValue={data.notifications.quiet_hours_end?.slice(0, 5) || ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg">
              <Save className="mr-2 h-4 w-4" />
              Simpan pengaturan
            </Button>
          </div>
        </form>
      ) : null}

      <Card className="lg:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-emerald-600" />
            Navigasi lainnya
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {moreLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
