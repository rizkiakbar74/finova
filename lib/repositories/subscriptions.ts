import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionCreateInput, SubscriptionUpdateInput } from "@/lib/validators/finance.schema";

export interface SubscriptionRecord {
  id: string;
  name: string;
  amount: number | string;
  billing_cycle: "monthly" | "yearly";
  next_renewal_date: string;
  category: string | null;
  auto_renew: boolean;
  status: "active" | "cancelled" | "paused";
  unused_flag: boolean;
  created_at: string;
}

const subscriptionSelect =
  "id, name, amount, billing_cycle, next_renewal_date, category, auto_renew, status, unused_flag, created_at";

export async function listSubscriptions(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("subscriptions")
    .select(subscriptionSelect)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("next_renewal_date", { ascending: true });
}

export async function createSubscription(
  supabase: SupabaseClient,
  userId: string,
  input: SubscriptionCreateInput
) {
  return supabase
    .from("subscriptions")
    .insert({ user_id: userId, ...input })
    .select("id")
    .single();
}

export async function updateSubscription(
  supabase: SupabaseClient,
  userId: string,
  input: SubscriptionUpdateInput
) {
  const { id, ...payload } = input;
  return supabase
    .from("subscriptions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}

export async function softDeleteSubscription(supabase: SupabaseClient, userId: string, id: string) {
  return supabase
    .from("subscriptions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .single();
}
