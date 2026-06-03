import Link from "next/link";
import { WalletCards } from "lucide-react";
import { AddTransactionForm } from "@/components/transactions/add-transaction-form";
import { PageHeader } from "@/components/layout/page-header";
import { AuthAlert } from "@/components/states/auth-alert";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOnboardedUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/repositories/categories";
import { listWallets } from "@/lib/repositories/wallets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AddTransactionPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AddTransactionPage({ searchParams }: AddTransactionPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();

  const [{ data: wallets, error: walletError }, { data: categories, error: categoryError }] = await Promise.all([
    listWallets(supabase, user.id),
    listCategories(supabase, user.id)
  ]);

  const activeWallets = (wallets || []).filter((wallet) => !wallet.is_archived);
  const activeCategories = (categories || []).filter((category) => !category.is_archived);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Transaksi"
        description="Catat pemasukan atau pengeluaran memakai dompet dan kategori aktif."
        badge="Alur mobile"
        actions={
          <Button asChild variant="outline">
            <Link href="/transactions">Lihat transaksi</Link>
          </Button>
        }
      />

      <AuthAlert error={params.error || walletError?.message || categoryError?.message} message={params.message} />

      {activeWallets.length === 0 || activeCategories.length === 0 ? (
        <EmptyState
          title="Lengkapi dompet dan kategori dulu"
          description="Transaksi membutuhkan minimal satu dompet aktif dan satu kategori aktif."
          actionLabel="Buka dompet"
          actionHref="/wallets"
          icon={<WalletCards className="h-5 w-5" />}
        />
      ) : (
        <Card className="mx-auto max-w-4xl bg-white">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Detail transaksi</CardTitle>
              <Badge variant="success">{activeWallets.length} dompet tersedia</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <AddTransactionForm wallets={activeWallets} categories={activeCategories} defaultDate={today()} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
