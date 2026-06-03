"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CalendarDays, ReceiptText, Save, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryRecord } from "@/lib/repositories/categories";
import type { WalletRecord } from "@/lib/repositories/wallets";
import { cn } from "@/lib/utils";
import { localizeCategoryName } from "@/lib/utils/localization";

interface AddTransactionFormProps {
  wallets: WalletRecord[];
  categories: CategoryRecord[];
  defaultDate: string;
}

function getInitialType(categories: CategoryRecord[]) {
  if (categories.some((category) => category.type === "expense")) return "expense";
  return "income";
}

export function AddTransactionForm({ wallets, categories, defaultDate }: AddTransactionFormProps) {
  const router = useRouter();
  const [type, setType] = useState<"income" | "expense">(getInitialType(categories));
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type && !category.is_archived),
    [categories, type]
  );
  const selectedCategory = selectedCategoryId || filteredCategories[0]?.id || "";

  async function submitTransaction(formData: FormData) {
    setError(null);

    const payload = {
      type,
      amount: formData.get("amount"),
      transaction_date: formData.get("transaction_date"),
      wallet_id: formData.get("wallet_id"),
      category_id: selectedCategory,
      merchant: formData.get("merchant"),
      notes: formData.get("notes"),
      status: formData.get("status"),
      is_recurring: formData.get("is_recurring") === "on"
    };

    startTransition(async () => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || "Transaksi belum bisa disimpan.");
        return;
      }

      router.replace("/transactions?message=Transaksi%20berhasil%20dibuat.");
    });
  }

  return (
    <form action={submitTransaction} className="space-y-5 sm:space-y-6">
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            value: "income" as const,
            title: "Pemasukan",
            description: "Uang yang diterima",
            icon: ArrowUp,
            tone: "emerald"
          },
          {
            value: "expense" as const,
            title: "Pengeluaran",
            description: "Uang yang dibelanjakan",
            icon: ArrowDown,
            tone: "red"
          }
        ].map((item) => {
          const Icon = item.icon;
          const active = type === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setType(item.value);
                setSelectedCategoryId("");
              }}
              className={cn(
                "flex min-h-28 flex-col items-start justify-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition sm:flex-row sm:items-center sm:p-4",
                active && item.tone === "emerald" && "border-emerald-300 bg-emerald-50/70",
                active && item.tone === "red" && "border-red-200 bg-red-50/70",
                !active && "border-slate-200 hover:border-emerald-200"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12",
                  item.tone === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-950">{item.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">{item.description}</span>
                </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Jumlah</Label>
        <div className="relative">
          <ReceiptText className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="125000"
            className="h-14 pl-11 text-lg"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Kategori</Label>
          <span className="text-xs text-muted-foreground">{filteredCategories.length} tersedia</span>
        </div>
        {filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-muted-foreground">
            Buat kategori {type === "income" ? "pemasukan" : "pengeluaran"} aktif terlebih dahulu.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredCategories.map((category) => {
              const active = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={cn(
                    "flex min-h-24 min-w-0 flex-col items-center justify-center rounded-2xl border bg-white px-3 py-4 text-center text-sm font-medium text-slate-700 shadow-sm transition",
                    active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 hover:border-emerald-200"
                  )}
                >
                  <span
                    className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold text-white"
                    style={{ backgroundColor: category.color || "#059669" }}
                  >
                    {(category.icon || localizeCategoryName(category.name)).slice(0, 2).toUpperCase()}
                  </span>
                  <span className="line-clamp-2">{localizeCategoryName(category.name)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="wallet_id">Dompet</Label>
          <div className="relative">
            <WalletCards className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              id="wallet_id"
              name="wallet_id"
              className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 pl-10 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name} - IDR
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transaction_date">Tanggal</Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="transaction_date" name="transaction_date" type="date" defaultValue={defaultDate} className="pl-10" required />
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="merchant">Merchant atau sumber</Label>
          <Input id="merchant" name="merchant" placeholder="Kopi, gaji, vendor" maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="posted"
            className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="posted">Tercatat</option>
            <option value="pending">Tertunda</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <textarea
          id="notes"
          name="notes"
          maxLength={500}
          rows={4}
          className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Konteks tambahan"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" name="is_recurring" className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
        Transaksi berulang
      </label>

      <Button type="submit" size="lg" className="min-h-12 w-full" disabled={isPending || filteredCategories.length === 0}>
        <Save className="mr-2 h-4 w-4" />
        {isPending ? "Menyimpan..." : "Simpan transaksi"}
      </Button>
    </form>
  );
}
