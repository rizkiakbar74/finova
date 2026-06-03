import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecurringBillCreateInput, RecurringBillUpdateInput } from "@/lib/validators/finance.schema";

export interface RecurringBillRecord {
  id: string;
  name: string;
  amount: number | string;
  category_id: string | null;
  wallet_id: string | null;
  frequency: "weekly" | "monthly" | "yearly";
  next_due_date: string;
  reminder_days: number;
  auto_pay: boolean;
  status: "active" | "paused" | "overdue";
  created_at: string;
  category: { id: string; name: string; color: string | null } | null;
  wallet: { id: string; name: string; currency: string } | null;
}

type RawRecurringBillRecord = Omit<RecurringBillRecord, "category" | "wallet"> & {
  category: RecurringBillRecord["category"] | RecurringBillRecord["category"][];
  wallet: RecurringBillRecord["wallet"] | RecurringBillRecord["wallet"][];
};

const recurringBillSelect = `
  id,
  name,
  amount,
  category_id,
  wallet_id,
  frequency,
  next_due_date,
  reminder_days,
  auto_pay,
  status,
  created_at,
  category:categories(id, name, color),
  wallet:wallets(id, name, currency)
`;

export async function listRecurringBills(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("recurring_bills")
    .select(recurringBillSelect)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("next_due_date", { ascending: true });

  if (error) return { data: null, error };

  return {
    data: ((data || []) as unknown as RawRecurringBillRecord[]).map((bill) => ({
      ...bill,
      category: Array.isArray(bill.category) ? bill.category[0] ?? null : bill.category,
      wallet: Array.isArray(bill.wallet) ? bill.wallet[0] ?? null : bill.wallet
    })),
    error: null
  };
}

export async function createRecurringBill(
  supabase: SupabaseClient,
  userId: string,
  input: RecurringBillCreateInput
) {
  return supabase
    .from("recurring_bills")
    .insert({ user_id: userId, ...input })
    .select("id")
    .single();
}

export async function updateRecurringBill(
  supabase: SupabaseClient,
  userId: string,
  input: RecurringBillUpdateInput
) {
  const { id, ...payload } = input;
  return supabase
    .from("recurring_bills")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}

export async function softDeleteRecurringBill(supabase: SupabaseClient, userId: string, id: string) {
  return supabase
    .from("recurring_bills")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}
