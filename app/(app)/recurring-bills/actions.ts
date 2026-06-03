"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import {
  createRecurringBill,
  softDeleteRecurringBill,
  updateRecurringBill
} from "@/lib/repositories/recurring-bills";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError, formDataToObject } from "@/lib/utils/form";
import {
  recurringBillCreateSchema,
  recurringBillDeleteSchema,
  recurringBillUpdateSchema
} from "@/lib/validators/finance.schema";

function redirectRecurringWithError(message: string): never {
  redirect(`/recurring-bills?error=${encodeURIComponent(message)}`);
}

function redirectRecurringWithMessage(message: string): never {
  redirect(`/recurring-bills?message=${encodeURIComponent(message)}`);
}

async function getActionContext() {
  const user = await requireOnboardedUser();
  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

export async function createRecurringBillAction(formData: FormData) {
  const parsed = recurringBillCreateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) redirectRecurringWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await createRecurringBill(supabase, user.id, parsed.data);
  if (error) redirectRecurringWithError(error.message || "Tagihan rutin belum bisa dibuat.");

  revalidatePath("/recurring-bills");
  redirectRecurringWithMessage("Tagihan rutin dibuat.");
}

export async function updateRecurringBillAction(formData: FormData) {
  const parsed = recurringBillUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) redirectRecurringWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await updateRecurringBill(supabase, user.id, parsed.data);
  if (error) redirectRecurringWithError(error.message || "Tagihan rutin belum bisa diperbarui.");

  revalidatePath("/recurring-bills");
  redirectRecurringWithMessage("Tagihan rutin diperbarui.");
}

export async function deleteRecurringBillAction(formData: FormData) {
  const parsed = recurringBillDeleteSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) redirectRecurringWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await softDeleteRecurringBill(supabase, user.id, parsed.data.id);
  if (error) redirectRecurringWithError(error.message || "Tagihan rutin belum bisa dihapus.");

  revalidatePath("/recurring-bills");
  redirectRecurringWithMessage("Tagihan rutin dihapus.");
}
