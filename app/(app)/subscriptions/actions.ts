"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import {
  createSubscription,
  softDeleteSubscription,
  updateSubscription
} from "@/lib/repositories/subscriptions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError, formDataToObject } from "@/lib/utils/form";
import {
  subscriptionCreateSchema,
  subscriptionDeleteSchema,
  subscriptionUpdateSchema
} from "@/lib/validators/finance.schema";

function redirectSubscriptionsWithError(message: string): never {
  redirect(`/subscriptions?error=${encodeURIComponent(message)}`);
}

function redirectSubscriptionsWithMessage(message: string): never {
  redirect(`/subscriptions?message=${encodeURIComponent(message)}`);
}

async function getActionContext() {
  const user = await requireOnboardedUser();
  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

export async function createSubscriptionAction(formData: FormData) {
  const parsed = subscriptionCreateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) redirectSubscriptionsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await createSubscription(supabase, user.id, parsed.data);
  if (error) redirectSubscriptionsWithError(error.message || "Langganan belum bisa dibuat.");

  revalidatePath("/subscriptions");
  redirectSubscriptionsWithMessage("Langganan dibuat.");
}

export async function updateSubscriptionAction(formData: FormData) {
  const parsed = subscriptionUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) redirectSubscriptionsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await updateSubscription(supabase, user.id, parsed.data);
  if (error) redirectSubscriptionsWithError(error.message || "Langganan belum bisa diperbarui.");

  revalidatePath("/subscriptions");
  redirectSubscriptionsWithMessage("Langganan diperbarui.");
}

export async function deleteSubscriptionAction(formData: FormData) {
  const parsed = subscriptionDeleteSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) redirectSubscriptionsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await softDeleteSubscription(supabase, user.id, parsed.data.id);
  if (error) redirectSubscriptionsWithError(error.message || "Langganan belum bisa dihapus.");

  revalidatePath("/subscriptions");
  redirectSubscriptionsWithMessage("Langganan dihapus.");
}
