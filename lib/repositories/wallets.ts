import type { SupabaseClient } from "@supabase/supabase-js";
import type { WalletCreateInput, WalletUpdateInput } from "@/lib/validators/finance.schema";

export interface WalletRecord {
  id: string;
  name: string;
  type: "cash" | "bank" | "e_wallet" | "credit_card" | "investment" | "other";
  initial_balance: number | string;
  currency: string;
  color: string | null;
  icon: string | null;
  is_archived: boolean;
  created_at: string;
}

const walletSelect = "id, name, type, initial_balance, currency, color, icon, is_archived, created_at";

export async function listWallets(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("wallets")
    .select(walletSelect)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("is_archived", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function createWallet(supabase: SupabaseClient, userId: string, input: WalletCreateInput) {
  return supabase
    .from("wallets")
    .insert({
      user_id: userId,
      name: input.name,
      type: input.type,
      initial_balance: input.initial_balance,
      currency: input.currency,
      color: input.color,
      icon: input.icon
    })
    .select(walletSelect)
    .single();
}

export async function updateWallet(supabase: SupabaseClient, userId: string, input: WalletUpdateInput) {
  return supabase
    .from("wallets")
    .update({
      name: input.name,
      type: input.type,
      initial_balance: input.initial_balance,
      currency: input.currency,
      color: input.color,
      icon: input.icon,
      is_archived: input.is_archived
    })
    .eq("id", input.id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(walletSelect)
    .single();
}

export async function softDeleteWallet(supabase: SupabaseClient, userId: string, id: string) {
  return supabase
    .from("wallets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}
