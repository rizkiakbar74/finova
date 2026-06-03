import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardRange } from "@/lib/validators/finance.schema";
import { DEFAULT_CURRENCY } from "@/lib/constants/app";
import { localizeCategoryName } from "@/lib/utils/localization";

interface DashboardWallet {
  id: string;
  name: string;
  currency: string;
  initial_balance: number | string;
  is_archived: boolean;
}

interface DashboardTransaction {
  id: string;
  wallet_id: string;
  category_id: string;
  type: "income" | "expense";
  amount: number | string;
  transaction_date: string;
  merchant: string | null;
  notes: string | null;
  status: "posted" | "pending";
  created_at: string;
  wallet: {
    id: string;
    name: string;
    currency: string;
  } | null;
  category: {
    id: string;
    name: string;
    type: "income" | "expense";
    color: string | null;
  } | null;
}

type RawDashboardTransaction = Omit<DashboardTransaction, "wallet" | "category"> & {
  wallet: DashboardTransaction["wallet"] | DashboardTransaction["wallet"][];
  category: DashboardTransaction["category"] | DashboardTransaction["category"][];
};

export interface DashboardSummary {
  currency: string;
  total_balance: number;
  income: number;
  expenses: number;
  net_cashflow: number;
  pending_count: number;
  transaction_count: number;
}

export interface CashflowPoint {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface SpendingCategoryPoint {
  category_id: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface RecentDashboardTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  transaction_date: string;
  merchant: string | null;
  wallet_name: string;
  category_name: string;
  currency: string;
  status: "posted" | "pending";
}

export interface DashboardData {
  summary: DashboardSummary;
  cashflow: CashflowPoint[];
  spendingByCategory: SpendingCategoryPoint[];
  recentTransactions: RecentDashboardTransaction[];
  range: DashboardRange;
}

function normalizeTransaction(transaction: RawDashboardTransaction): DashboardTransaction {
  return {
    ...transaction,
    wallet: Array.isArray(transaction.wallet) ? transaction.wallet[0] ?? null : transaction.wallet,
    category: Array.isArray(transaction.category) ? transaction.category[0] ?? null : transaction.category
  };
}

function eachDateInRange(range: DashboardRange) {
  const dates: string[] = [];
  const cursor = new Date(`${range.date_from}T00:00:00.000Z`);
  const end = new Date(`${range.date_to}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function defaultDashboardRange(): DashboardRange {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return {
    date_from: start.toISOString().slice(0, 10),
    date_to: end.toISOString().slice(0, 10)
  };
}

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
  range: DashboardRange
): Promise<{ data: DashboardData | null; error: string | null }> {
  const [{ data: wallets, error: walletError }, { data: transactions, error: transactionError }] =
    await Promise.all([
      supabase
        .from("wallets")
        .select("id, name, currency, initial_balance, is_archived")
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabase
        .from("transactions")
        .select(
          `
          id,
          wallet_id,
          category_id,
          type,
          amount,
          transaction_date,
          merchant,
          notes,
          status,
          created_at,
          wallet:wallets(id, name, currency),
          category:categories(id, name, type, color)
        `
        )
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gte("transaction_date", range.date_from)
        .lte("transaction_date", range.date_to)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
    ]);

  if (walletError) return { data: null, error: walletError.message };
  if (transactionError) return { data: null, error: transactionError.message };

  const walletRows = (wallets || []) as DashboardWallet[];
  const transactionRows = ((transactions || []) as unknown as RawDashboardTransaction[]).map(normalizeTransaction);
  const currency = DEFAULT_CURRENCY;
  const primaryWalletIds = new Set(
    walletRows.filter((wallet) => !wallet.is_archived).map((wallet) => wallet.id)
  );
  const postedPrimaryTransactions = transactionRows.filter(
    (transaction) => transaction.status === "posted"
  );
  const income = postedPrimaryTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const expenses = postedPrimaryTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const openingBalance = walletRows
    .filter((wallet) => primaryWalletIds.has(wallet.id))
    .reduce((total, wallet) => total + Number(wallet.initial_balance), 0);
  const cashflowByDate = new Map<string, CashflowPoint>();

  eachDateInRange(range).forEach((date) => {
    cashflowByDate.set(date, { date, income: 0, expenses: 0, net: 0 });
  });

  postedPrimaryTransactions.forEach((transaction) => {
    const point = cashflowByDate.get(transaction.transaction_date);
    if (!point) return;

    if (transaction.type === "income") {
      point.income += Number(transaction.amount);
    } else {
      point.expenses += Number(transaction.amount);
    }
    point.net = point.income - point.expenses;
  });

  const spendingByCategoryMap = new Map<string, SpendingCategoryPoint>();
  postedPrimaryTransactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const categoryId = transaction.category?.id || transaction.category_id;
      const existing = spendingByCategoryMap.get(categoryId);
      const amount = Number(transaction.amount);

      if (existing) {
        existing.amount += amount;
        return;
      }

      spendingByCategoryMap.set(categoryId, {
        category_id: categoryId,
        name: localizeCategoryName(transaction.category?.name || "Uncategorized"),
        color: transaction.category?.color || "#059669",
        amount,
        percentage: 0
      });
    });

  const spendingTotal = Array.from(spendingByCategoryMap.values()).reduce((total, item) => total + item.amount, 0);
  const spendingByCategory = Array.from(spendingByCategoryMap.values())
    .map((item) => ({
      ...item,
      percentage: spendingTotal > 0 ? Math.round((item.amount / spendingTotal) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const recentTransactions = transactionRows.slice(0, 6).map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount),
    transaction_date: transaction.transaction_date,
    merchant: transaction.merchant,
    wallet_name: transaction.wallet?.name || "Dompet",
    category_name: localizeCategoryName(transaction.category?.name || "Kategori"),
    currency,
    status: transaction.status
  }));

  return {
    data: {
      range,
      summary: {
        currency,
        total_balance: openingBalance + income - expenses,
        income,
        expenses,
        net_cashflow: income - expenses,
        pending_count: transactionRows.filter((transaction) => transaction.status === "pending").length,
        transaction_count: transactionRows.length
      },
      cashflow: Array.from(cashflowByDate.values()),
      spendingByCategory,
      recentTransactions
    },
    error: null
  };
}
