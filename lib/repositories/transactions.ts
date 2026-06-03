import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TransactionCreateInput,
  TransactionFilters,
  TransactionUpdateInput
} from "@/lib/validators/finance.schema";

export interface TransactionRecord {
  id: string;
  wallet_id: string;
  category_id: string;
  type: "income" | "expense";
  amount: number | string;
  transaction_date: string;
  merchant: string | null;
  notes: string | null;
  status: "posted" | "pending";
  is_recurring: boolean;
  created_at: string;
  wallet: {
    id: string;
    name: string;
    currency: string;
    color: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    type: "income" | "expense";
    color: string | null;
    icon: string | null;
  } | null;
}

const transactionSelect = `
  id,
  wallet_id,
  category_id,
  type,
  amount,
  transaction_date,
  merchant,
  notes,
  status,
  is_recurring,
  created_at,
  wallet:wallets(id, name, currency, color),
  category:categories(id, name, type, color, icon)
`;

export async function listTransactions(
  supabase: SupabaseClient,
  userId: string,
  filters: TransactionFilters
) {
  let query = supabase
    .from("transactions")
    .select(transactionSelect)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.wallet_id !== "all") {
    query = query.eq("wallet_id", filters.wallet_id);
  }

  if (filters.category_id !== "all") {
    query = query.eq("category_id", filters.category_id);
  }

  if (filters.date_from) {
    query = query.gte("transaction_date", filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte("transaction_date", filters.date_to);
  }

  const searchTerm = filters.query.replace(/[,%()]/g, " ").trim();
  if (searchTerm) {
    query = query.or(`merchant.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
  }

  return query;
}

export async function createTransaction(
  supabase: SupabaseClient,
  userId: string,
  input: TransactionCreateInput
) {
  return supabase
    .from("transactions")
    .insert({
      user_id: userId,
      wallet_id: input.wallet_id,
      category_id: input.category_id,
      type: input.type,
      amount: input.amount,
      transaction_date: input.transaction_date,
      merchant: input.merchant ?? null,
      notes: input.notes ?? null,
      status: input.status,
      is_recurring: input.is_recurring
    })
    .select(transactionSelect)
    .single();
}

export async function updateTransaction(
  supabase: SupabaseClient,
  userId: string,
  input: TransactionUpdateInput
) {
  return supabase
    .from("transactions")
    .update({
      wallet_id: input.wallet_id,
      category_id: input.category_id,
      type: input.type,
      amount: input.amount,
      transaction_date: input.transaction_date,
      merchant: input.merchant ?? null,
      notes: input.notes ?? null,
      status: input.status,
      is_recurring: input.is_recurring
    })
    .eq("id", input.id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(transactionSelect)
    .single();
}

export async function softDeleteTransaction(supabase: SupabaseClient, userId: string, id: string) {
  return supabase
    .from("transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}
