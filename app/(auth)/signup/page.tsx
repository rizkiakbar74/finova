import Link from "next/link";
import { signUpAction } from "@/app/(auth)/actions";
import { AuthAlert } from "@/components/states/auth-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_440px]">
      <section className="hidden flex-col justify-center lg:flex">
        <div className="mb-6 inline-flex w-fit rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
          Mulai dengan pencatatan keuangan manual
        </div>
        <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
          Bangun rutinitas keuangan yang lebih tenang bersama Finova.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
          Buat akun, siapkan dompet pertama, lalu mulai catat pemasukan dan pengeluaran dari dashboard pribadi.
        </p>
      </section>

      <Card className="w-full border-slate-200 bg-white/90 shadow-soft backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Buat akun</CardTitle>
          <CardDescription>Gunakan email dan kata sandi untuk mulai memakai Finova.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUpAction} className="space-y-5">
            <AuthAlert error={params.error} message={params.message} />

            <div className="space-y-2">
              <Label htmlFor="full_name">Nama lengkap</Label>
              <Input id="full_name" name="full_name" placeholder="Budi Santoso" autoComplete="name" required />
            </div>

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
                autoComplete="new-password"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Buat akun Finova
            </Button>

            <p className="text-center text-sm text-slate-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
                Masuk
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
