import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, CreditCard, Filter, Plus, Save, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AuthAlert } from "@/components/states/auth-alert";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireOnboardedUser } from "@/lib/auth/session";
import { listCategories, type CategoryRecord } from "@/lib/repositories/categories";
import { listTransactions, type TransactionRecord } from "@/lib/repositories/transactions";
import { listWallets, type WalletRecord } from "@/lib/repositories/wallets";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { transactionFilterSchema, type TransactionFilters } from "@/lib/validators/finance.schema";
import { deleteTransactionAction, updateTransactionAction } from "./actions";

interface TransactionsPageProps {
  searchParams?: Promise<Record<string, string | undefined>>;
}

function formatMoney(value: number | string, currency: string, type: "income" | "expense") {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value));

  return `${type === "income" ? "+" : "-"}${formatted}`;
}

function transactionCurrency(transaction: TransactionRecord) {
  return transaction.wallet?.currency || "IDR";
}

type RawTransactionRecord = Omit<TransactionRecord, "wallet" | "category"> & {
  wallet: TransactionRecord["wallet"] | TransactionRecord["wallet"][];
  category: TransactionRecord["category"] | TransactionRecord["category"][];
};

function normalizeTransaction(transaction: RawTransactionRecord): TransactionRecord {
  return {
    ...transaction,
    wallet: Array.isArray(transaction.wallet) ? transaction.wallet[0] ?? null : transaction.wallet,
    category: Array.isArray(transaction.category) ? transaction.category[0] ?? null : transaction.category
  };
}

interface TransactionFiltersFormProps {
  filters: TransactionFilters;
  activeWallets: WalletRecord[];
  activeCategories: CategoryRecord[];
  idPrefix?: string;
  compact?: boolean;
}

function TransactionFiltersForm({
  filters,
  activeWallets,
  activeCategories,
  idPrefix = "",
  compact = false
}: TransactionFiltersFormProps) {
  const prefix = idPrefix ? `${idPrefix}-` : "";

  return (
    <form className={compact ? "grid gap-3" : "grid gap-3 lg:grid-cols-12"} action="/transactions">
      <div className={compact ? "space-y-1" : "space-y-1 lg:col-span-3"}>
        <Label htmlFor={`${prefix}query`}>Cari</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id={`${prefix}query`} name="query" defaultValue={filters.query} placeholder="Nama merchant atau catatan" className="pl-10" />
        </div>
      </div>
      <div className={compact ? "space-y-1" : "space-y-1 lg:col-span-2"}>
        <Label htmlFor={`${prefix}type`}>Jenis</Label>
        <select
          id={`${prefix}type`}
          name="type"
          defaultValue={filters.type}
          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Semua</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
      </div>
      <div className={compact ? "space-y-1" : "space-y-1 lg:col-span-2"}>
        <Label htmlFor={`${prefix}wallet_id`}>Dompet</Label>
        <select
          id={`${prefix}wallet_id`}
          name="wallet_id"
          defaultValue={filters.wallet_id}
          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Semua dompet</option>
          {activeWallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>
      </div>
      <div className={compact ? "space-y-1" : "space-y-1 lg:col-span-2"}>
        <Label htmlFor={`${prefix}category_id`}>Kategori</Label>
        <select
          id={`${prefix}category_id`}
          name="category_id"
          defaultValue={filters.category_id}
          className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Semua kategori</option>
          {activeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className={compact ? "space-y-1" : "space-y-1 lg:col-span-1"}>
        <Label htmlFor={`${prefix}date_from`}>Dari</Label>
        <Input id={`${prefix}date_from`} name="date_from" type="date" defaultValue={filters.date_from || ""} />
      </div>
      <div className={compact ? "space-y-1" : "space-y-1 lg:col-span-1"}>
        <Label htmlFor={`${prefix}date_to`}>Sampai</Label>
        <Input id={`${prefix}date_to`} name="date_to" type="date" defaultValue={filters.date_to || ""} />
      </div>
      <div className={compact ? "flex items-end pt-1" : "flex items-end lg:col-span-1"}>
        <Button type="submit" variant={compact ? "default" : "outline"} className="w-full">
          <Filter className={compact ? "mr-2 h-4 w-4" : "h-4 w-4"} />
          {compact ? "Terapkan filter" : null}
        </Button>
      </div>
    </form>
  );
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const user = await requireOnboardedUser();
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();
  const parsedFilters = transactionFilterSchema.safeParse(params);
  const filters = parsedFilters.success ? parsedFilters.data : transactionFilterSchema.parse({});

  const [
    { data: transactions, error: transactionError },
    { data: wallets, error: walletError },
    { data: categories, error: categoryError }
  ] = await Promise.all([
    listTransactions(supabase, user.id, filters),
    listWallets(supabase, user.id),
    listCategories(supabase, user.id)
  ]);

  const transactionRows = ((transactions || []) as unknown as RawTransactionRecord[]).map(normalizeTransaction);
  const activeWallets = (wallets || []).filter((wallet) => !wallet.is_archived);
  const activeCategories = (categories || []).filter((category) => !category.is_archived);
  const incomeTotal = transactionRows
    .filter((transaction) => transaction.type === "income" && transaction.status === "posted")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const expenseTotal = transactionRows
    .filter((transaction) => transaction.type === "expense" && transaction.status === "posted")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const primaryCurrency = activeWallets[0]?.currency || transactionRows[0]?.wallet?.currency || "IDR";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi"
        description="Cari, filter, edit, dan kelola catatan pemasukan atau pengeluaran."
        actions={
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              Tambah transaksi
            </Link>
          </Button>
        }
      />

      <AuthAlert
        error={params.error || (!parsedFilters.success ? "Sebagian filter diabaikan." : undefined) || transactionError?.message || walletError?.message || categoryError?.message}
        message={params.message}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Transaksi" value={String(transactionRows.length)} description="Tampilan sesuai filter" icon={CreditCard} />
        <KpiCard
          title="Pemasukan tercatat"
          value={new Intl.NumberFormat("id-ID", { style: "currency", currency: primaryCurrency }).format(incomeTotal)}
          description="Sesuai filter"
          icon={ArrowUp}
          tone="success"
        />
        <KpiCard
          title="Pengeluaran tercatat"
          value={new Intl.NumberFormat("id-ID", { style: "currency", currency: primaryCurrency }).format(expenseTotal)}
          description="Sesuai filter"
          icon={ArrowDown}
          tone="danger"
        />
      </section>

      <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-950 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-700" />
            Filter
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </summary>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <TransactionFiltersForm
            filters={filters}
            activeWallets={activeWallets}
            activeCategories={activeCategories}
            idPrefix="mobile"
            compact
          />
        </div>
      </details>

      <Card className="hidden bg-white lg:block">
        <CardContent className="p-5">
          <TransactionFiltersForm filters={filters} activeWallets={activeWallets} activeCategories={activeCategories} />
        </CardContent>
      </Card>

      {transactionRows.length === 0 ? (
        <EmptyState
          title="Transaksi tidak ditemukan"
          description="Buat transaksi pertama atau ubah filter."
          actionLabel="Tambah transaksi"
          actionHref="/transactions/new"
          icon={<CreditCard className="h-5 w-5" />}
        />
      ) : (
        <div className="grid gap-4">
          {transactionRows.map((transaction) => (
            <Card key={transaction.id} className="bg-white">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        transaction.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-950">
                          {transaction.merchant || transaction.category?.name || "Transaksi"}
                        </p>
                        <Badge variant={transaction.type === "income" ? "success" : "danger"}>
                          {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </Badge>
                        <Badge variant={transaction.status === "posted" ? "success" : "warning"}>
                          {transaction.status === "posted" ? "Tercatat" : "Tertunda"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {transaction.transaction_date} - {transaction.wallet?.name || "Dompet"} -{" "}
                        {transaction.category?.name || "Kategori"}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-lg font-semibold ${
                      transaction.type === "income" ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {formatMoney(transaction.amount, transactionCurrency(transaction), transaction.type)}
                  </p>
                </div>

                <form action={updateTransactionAction} className="grid gap-3 lg:grid-cols-12">
                  <input type="hidden" name="id" value={transaction.id} />
                  <div className="space-y-1 lg:col-span-2">
                    <Label htmlFor={`type-${transaction.id}`}>Jenis</Label>
                    <select
                      id={`type-${transaction.id}`}
                      name="type"
                      defaultValue={transaction.type}
                      className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="income">Pemasukan</option>
                      <option value="expense">Pengeluaran</option>
                    </select>
                  </div>
                  <div className="space-y-1 lg:col-span-2">
                    <Label htmlFor={`amount-${transaction.id}`}>Jumlah</Label>
                    <Input id={`amount-${transaction.id}`} name="amount" type="number" step="0.01" min="0.01" defaultValue={String(transaction.amount)} required />
                  </div>
                  <div className="space-y-1 lg:col-span-2">
                    <Label htmlFor={`date-${transaction.id}`}>Tanggal</Label>
                    <Input id={`date-${transaction.id}`} name="transaction_date" type="date" defaultValue={transaction.transaction_date} required />
                  </div>
                  <div className="space-y-1 lg:col-span-3">
                    <Label htmlFor={`wallet-${transaction.id}`}>Dompet</Label>
                    <select
                      id={`wallet-${transaction.id}`}
                      name="wallet_id"
                      defaultValue={transaction.wallet_id}
                      className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {activeWallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 lg:col-span-3">
                    <Label htmlFor={`category-${transaction.id}`}>Kategori</Label>
                    <select
                      id={`category-${transaction.id}`}
                      name="category_id"
                      defaultValue={transaction.category_id}
                      className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {activeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} - {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 lg:col-span-3">
                    <Label htmlFor={`merchant-${transaction.id}`}>Merchant/sumber</Label>
                    <Input id={`merchant-${transaction.id}`} name="merchant" defaultValue={transaction.merchant || ""} maxLength={120} />
                  </div>
                  <div className="space-y-1 lg:col-span-2">
                    <Label htmlFor={`status-${transaction.id}`}>Status</Label>
                    <select
                      id={`status-${transaction.id}`}
                      name="status"
                      defaultValue={transaction.status}
                      className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="posted">Tercatat</option>
                      <option value="pending">Tertunda</option>
                    </select>
                  </div>
                  <div className="space-y-1 lg:col-span-7">
                    <Label htmlFor={`notes-${transaction.id}`}>Catatan</Label>
                    <Input id={`notes-${transaction.id}`} name="notes" defaultValue={transaction.notes || ""} maxLength={500} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-12">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="is_recurring"
                        defaultChecked={transaction.is_recurring}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      Berulang
                    </label>
                    <Button type="submit" variant="outline">
                      <Save className="mr-2 h-4 w-4" />
                      Simpan
                    </Button>
                  </div>
                </form>

                <form action={deleteTransactionAction}>
                  <input type="hidden" name="id" value={transaction.id} />
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
  );
}
