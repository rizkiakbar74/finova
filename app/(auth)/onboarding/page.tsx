import { completeOnboardingAction } from "@/app/(auth)/actions";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY } from "@/lib/constants/app";
import { AuthAlert } from "@/components/states/auth-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, UserRound, Wallet } from "lucide-react";

interface OnboardingPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("currency, timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: existingWallets } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .limit(1);

  const fullName = profile?.full_name || user.user_metadata?.full_name || "";
  const currency = DEFAULT_CURRENCY;
  const timezone = settings?.timezone || "Asia/Jakarta";
  const hasWallet = Boolean(existingWallets?.length);

  return (
    <div className="w-full max-w-3xl">
      <Card className="border-slate-200 bg-white/95 shadow-soft">
        <CardHeader>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Badge variant="success">Onboarding aktif</Badge>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
          <CardTitle className="text-3xl">Selamat datang di Finova</CardTitle>
          <CardDescription className="text-base leading-7">
            Lengkapi profil, preferensi keuangan, dan dompet pertama sebelum masuk ke ringkasan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AuthAlert error={params.error} message={params.message} />

          <form action={completeOnboardingAction} className="space-y-6">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <UserRound className="h-4 w-4 text-emerald-600" />
                Profil
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama lengkap</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={fullName}
                  autoComplete="name"
                  placeholder="Nama kamu"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Settings2 className="h-4 w-4 text-emerald-600" />
                  Preferensi
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Mata uang utama</Label>
                  <select
                    id="currency"
                    name="currency"
                    defaultValue={currency}
                    className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="IDR">IDR</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona waktu</Label>
                  <Input id="timezone" name="timezone" defaultValue={timezone} required maxLength={80} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Dompet awal
                </div>
                {hasWallet ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                    Dompet aktif sudah tersedia. Finova akan mempertahankannya dan menyelesaikan onboarding.
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="wallet_name">Nama dompet</Label>
                  <Input
                    id="wallet_name"
                    name="wallet_name"
                    defaultValue="Dompet Tunai"
                    placeholder="Dompet Tunai"
                    required
                    maxLength={80}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wallet_type">Jenis dompet</Label>
                    <select
                      id="wallet_type"
                      name="wallet_type"
                      defaultValue="cash"
                      className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="cash">Tunai</option>
                      <option value="bank">Bank</option>
                      <option value="e_wallet">E-wallet</option>
                      <option value="credit_card">Kartu kredit</option>
                      <option value="investment">Investasi</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initial_balance">Saldo awal</Label>
                    <Input
                      id="initial_balance"
                      name="initial_balance"
                      type="number"
                      defaultValue="0"
                      step="0.01"
                      inputMode="decimal"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            <Button type="submit" size="lg" className="w-full">
              Lanjut ke ringkasan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
