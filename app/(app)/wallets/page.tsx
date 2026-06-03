import {
  Archive,
  CircleDollarSign,
  FolderKanban,
  Plus,
  Save,
  Trash2,
  WalletCards
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AuthAlert } from "@/components/states/auth-alert";
import { EmptyState } from "@/components/states/empty-state";
import { CategoryPicker } from "@/components/finance/category-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireOnboardedUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/repositories/categories";
import { listWallets } from "@/lib/repositories/wallets";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createCategoryAction,
  createWalletAction,
  deleteCategoryAction,
  deleteWalletAction,
  updateCategoryAction,
  updateWalletAction
} from "./actions";

interface WalletsPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}

const currencies = ["IDR"];
const walletTypes = [
  { value: "cash", label: "Tunai" },
  { value: "bank", label: "Bank" },
  { value: "e_wallet", label: "E-wallet" },
  { value: "credit_card", label: "Kartu kredit" },
  { value: "investment", label: "Investasi" },
  { value: "other", label: "Lainnya" }
];
const categoryTypes = [
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" }
];

function formatMoney(value: number | string, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value));
}

export default async function WalletsPage({ searchParams }: WalletsPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();

  const [{ data: wallets, error: walletError }, { data: categories, error: categoryError }, { data: settings }] =
    await Promise.all([
      listWallets(supabase, user.id),
      listCategories(supabase, user.id),
      supabase.from("user_settings").select("currency").eq("user_id", user.id).maybeSingle()
    ]);

  const walletRows = wallets || [];
  const categoryRows = categories || [];
  const primaryCurrency = settings?.currency || walletRows[0]?.currency || "IDR";
  const activeWallets = walletRows.filter((wallet) => !wallet.is_archived);
  const archivedWallets = walletRows.filter((wallet) => wallet.is_archived);
  const activeCategories = categoryRows.filter((category) => !category.is_archived);
  const customCategories = categoryRows.filter((category) => !category.is_default);
  const totalOpeningBalance = activeWallets
    .filter((wallet) => wallet.currency === primaryCurrency)
    .reduce((total, wallet) => total + Number(wallet.initial_balance), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dompet & Kategori"
        description="Kelola akun/dompet dan label kategori untuk semua catatan keuangan."
        actions={
          <Button asChild variant="outline">
            <a href="#new-wallet">
              <Plus className="mr-2 h-4 w-4" />
              Dompet
            </a>
          </Button>
        }
      />

      <AuthAlert
        error={params.error || walletError?.message || categoryError?.message}
        message={params.message}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Dompet aktif"
          value={String(activeWallets.length)}
          description={`${archivedWallets.length} diarsipkan`}
          icon={WalletCards}
          tone="success"
        />
        <KpiCard
          title={`Saldo awal (${primaryCurrency})`}
          value={formatMoney(totalOpeningBalance, primaryCurrency)}
          description="Dari dompet aktif"
          icon={CircleDollarSign}
        />
        <KpiCard
          title="Kategori aktif"
          value={String(activeCategories.length)}
          description={`${customCategories.length} kustom`}
          icon={FolderKanban}
          tone="warning"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Daftar dompet</h3>
            <Badge variant="success">{walletRows.length} total</Badge>
          </div>

          {walletRows.length === 0 ? (
            <EmptyState
              title="Belum ada dompet"
              description="Buat dompet pertama untuk mulai mencatat aktivitas keuangan."
              icon={<WalletCards className="h-5 w-5" />}
            />
          ) : (
            <div className="grid gap-4">
              {walletRows.map((wallet) => (
                <Card key={wallet.id} className="bg-white">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm"
                          style={{ backgroundColor: wallet.color || "#059669" }}
                        >
                          {(wallet.icon || wallet.name).slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold text-slate-950">{wallet.name}</p>
                            {wallet.is_archived ? <Badge variant="secondary">Diarsipkan</Badge> : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {walletTypes.find((type) => type.value === wallet.type)?.label || wallet.type} -{" "}
                            {formatMoney(wallet.initial_balance, wallet.currency)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <form action={updateWalletAction} className="grid gap-3 lg:grid-cols-12">
                      <input type="hidden" name="id" value={wallet.id} />
                      <div className="space-y-1 lg:col-span-3">
                        <Label htmlFor={`wallet-name-${wallet.id}`}>Nama</Label>
                        <Input id={`wallet-name-${wallet.id}`} name="name" defaultValue={wallet.name} maxLength={80} required />
                      </div>
                      <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor={`wallet-type-${wallet.id}`}>Jenis</Label>
                        <select
                          id={`wallet-type-${wallet.id}`}
                          name="type"
                          defaultValue={wallet.type}
                          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {walletTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor={`wallet-balance-${wallet.id}`}>Saldo awal</Label>
                        <Input
                          id={`wallet-balance-${wallet.id}`}
                          name="initial_balance"
                          type="number"
                          step="0.01"
                          defaultValue={String(wallet.initial_balance)}
                          required
                        />
                      </div>
                      <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor={`wallet-currency-${wallet.id}`}>Mata uang</Label>
                        <select
                          id={`wallet-currency-${wallet.id}`}
                          name="currency"
                          defaultValue={wallet.currency}
                          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {currencies.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1 lg:col-span-1">
                        <Label htmlFor={`wallet-color-${wallet.id}`}>Warna</Label>
                        <Input
                          id={`wallet-color-${wallet.id}`}
                          name="color"
                          type="color"
                          defaultValue={wallet.color || "#059669"}
                          className="p-1"
                        />
                      </div>
                      <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor={`wallet-icon-${wallet.id}`}>Ikon</Label>
                        <Input id={`wallet-icon-${wallet.id}`} name="icon" defaultValue={wallet.icon || "wallet"} maxLength={40} required />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-12">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            name="is_archived"
                            defaultChecked={wallet.is_archived}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <Archive className="h-4 w-4" />
                          Diarsipkan
                        </label>
                        <Button type="submit" variant="outline">
                          <Save className="mr-2 h-4 w-4" />
                          Simpan
                        </Button>
                      </div>
                    </form>

                    <form action={deleteWalletAction}>
                      <input type="hidden" name="id" value={wallet.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card id="new-wallet" className="bg-white">
          <CardHeader>
            <CardTitle>Dompet baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createWalletAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-wallet-name">Nama</Label>
                <Input id="new-wallet-name" name="name" placeholder="Dompet tunai" maxLength={80} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="new-wallet-type">Jenis</Label>
                  <select
                    id="new-wallet-type"
                    name="type"
                    defaultValue="cash"
                    className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {walletTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-wallet-currency">Mata uang</Label>
                  <select
                    id="new-wallet-currency"
                    name="currency"
                    defaultValue={primaryCurrency}
                    className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-wallet-balance">Saldo awal</Label>
                <Input id="new-wallet-balance" name="initial_balance" type="number" step="0.01" defaultValue="0" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-wallet-color">Warna</Label>
                  <Input id="new-wallet-color" name="color" type="color" defaultValue="#059669" className="p-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-wallet-icon">Ikon</Label>
                  <Input id="new-wallet-icon" name="icon" defaultValue="wallet" maxLength={40} required />
                </div>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Buat dompet
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Kategori baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCategoryAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-category-name">Nama</Label>
                <Input id="new-category-name" name="name" placeholder="Belanja harian" maxLength={60} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-category-type">Jenis</Label>
                <select
                  id="new-category-type"
                  name="type"
                  defaultValue="expense"
                  className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {categoryTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="new-category-color">Warna</Label>
                  <Input id="new-category-color" name="color" type="color" defaultValue="#059669" className="p-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category-icon">Ikon</Label>
                  <Input id="new-category-icon" name="icon" defaultValue="tag" maxLength={40} required />
                </div>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Buat kategori
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Kategori</h3>
            <Badge variant="success">{categoryRows.length} total</Badge>
          </div>

          <Card className="bg-white">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold text-slate-950">Pratinjau pilihan</p>
                <p className="mt-1 text-sm text-muted-foreground">Kategori pengeluaran yang tersedia untuk form.</p>
              </div>
              <CategoryPicker categories={categoryRows} name="category_picker_preview" type="expense" />
            </CardContent>
          </Card>

          {categoryRows.length === 0 ? (
            <EmptyState
              title="Belum ada kategori"
              description="Buat kategori pemasukan dan pengeluaran untuk transaksi berikutnya."
              icon={<FolderKanban className="h-5 w-5" />}
            />
          ) : (
            <div className="grid gap-4">
              {categoryRows.map((category) => (
                <Card key={category.id} className="bg-white">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold text-white shadow-sm"
                          style={{ backgroundColor: category.color || "#059669" }}
                        >
                          {(category.icon || category.name).slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">{category.name}</p>
                            <Badge variant={category.type === "income" ? "success" : "secondary"}>
                              {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                            </Badge>
                            {category.is_default ? <Badge variant="warning">Bawaan</Badge> : null}
                            {category.is_archived ? <Badge variant="secondary">Diarsipkan</Badge> : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <form action={updateCategoryAction} className="grid gap-3 lg:grid-cols-12">
                      <input type="hidden" name="id" value={category.id} />
                      <div className="space-y-1 lg:col-span-4">
                        <Label htmlFor={`category-name-${category.id}`}>Nama</Label>
                        <Input
                          id={`category-name-${category.id}`}
                          name="name"
                          defaultValue={category.name}
                          maxLength={60}
                          required
                        />
                      </div>
                      <div className="space-y-1 lg:col-span-3">
                        <Label htmlFor={`category-type-${category.id}`}>Jenis</Label>
                        <select
                          id={`category-type-${category.id}`}
                          name="type"
                          defaultValue={category.type}
                          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {categoryTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1 lg:col-span-2">
                        <Label htmlFor={`category-color-${category.id}`}>Warna</Label>
                        <Input
                          id={`category-color-${category.id}`}
                          name="color"
                          type="color"
                          defaultValue={category.color || "#059669"}
                          className="p-1"
                        />
                      </div>
                      <div className="space-y-1 lg:col-span-3">
                        <Label htmlFor={`category-icon-${category.id}`}>Ikon</Label>
                        <Input
                          id={`category-icon-${category.id}`}
                          name="icon"
                          defaultValue={category.icon || "tag"}
                          maxLength={40}
                          required
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-12">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            name="is_archived"
                            defaultChecked={category.is_archived}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <Archive className="h-4 w-4" />
                          Diarsipkan
                        </label>
                        <Button type="submit" variant="outline">
                          <Save className="mr-2 h-4 w-4" />
                          Simpan
                        </Button>
                      </div>
                    </form>

                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
