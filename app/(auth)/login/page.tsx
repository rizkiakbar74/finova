import Link from "next/link";
import { signInAction } from "@/app/(auth)/actions";
import { AuthAlert } from "@/components/states/auth-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    redirectTo?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_440px]">
      <section className="hidden flex-col justify-center lg:flex">
        <div className="mb-6 inline-flex w-fit rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
          Ruang kerja keuangan pribadi yang aman
        </div>
        <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
          Masuk kembali ke dashboard keuangan Anda.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
          Pantau pemasukan, pengeluaran, anggaran, tujuan, dan laporan dari satu akun Finova.
        </p>
      </section>

      <Card className="w-full border-slate-200 bg-white/90 shadow-soft backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Masuk</CardTitle>
          <CardDescription>Gunakan email dan kata sandi untuk mengakses Finova.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInAction} className="space-y-5">
            <AuthAlert error={params.error} message={params.message} />
            <input type="hidden" name="redirectTo" value={params.redirectTo || "/dashboard"} />

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="nama@email.com" autoComplete="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimal 8 karakter"
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Masuk ke Finova
            </Button>

            <p className="text-center text-sm text-slate-600">
              Baru memakai Finova?{" "}
              <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
                Buat akun
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
