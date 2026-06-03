"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import {
  createGoalContribution,
  createSavingsGoal,
  deleteGoalContribution,
  softDeleteSavingsGoal,
  updateSavingsGoal
} from "@/lib/repositories/goals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError, formDataToObject } from "@/lib/utils/form";
import {
  goalContributionCreateSchema,
  goalContributionDeleteSchema,
  savingsGoalCreateSchema,
  savingsGoalDeleteSchema,
  savingsGoalUpdateSchema
} from "@/lib/validators/finance.schema";

function redirectGoalsWithError(message: string): never {
  redirect(`/goals?error=${encodeURIComponent(message)}`);
}

function redirectGoalsWithMessage(message: string): never {
  redirect(`/goals?message=${encodeURIComponent(message)}`);
}

async function getActionContext() {
  const user = await requireOnboardedUser();
  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

export async function createGoalAction(formData: FormData) {
  const parsed = savingsGoalCreateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectGoalsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await createSavingsGoal(supabase, user.id, parsed.data);

  if (error) redirectGoalsWithError(error.message || "Tujuan belum bisa dibuat.");

  revalidatePath("/goals");
  redirectGoalsWithMessage("Tujuan dibuat.");
}

export async function updateGoalAction(formData: FormData) {
  const parsed = savingsGoalUpdateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectGoalsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await updateSavingsGoal(supabase, user.id, parsed.data);

  if (error) redirectGoalsWithError(error.message || "Tujuan belum bisa diperbarui.");

  revalidatePath("/goals");
  redirectGoalsWithMessage("Tujuan diperbarui.");
}

export async function deleteGoalAction(formData: FormData) {
  const parsed = savingsGoalDeleteSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectGoalsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await softDeleteSavingsGoal(supabase, user.id, parsed.data.id);

  if (error) redirectGoalsWithError(error.message || "Tujuan belum bisa dihapus.");

  revalidatePath("/goals");
  redirectGoalsWithMessage("Tujuan dihapus.");
}

export async function createGoalContributionAction(formData: FormData) {
  const parsed = goalContributionCreateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectGoalsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await createGoalContribution(supabase, user.id, parsed.data);

  if (error) redirectGoalsWithError(error.message || "Kontribusi belum bisa ditambahkan.");

  revalidatePath("/goals");
  redirectGoalsWithMessage("Kontribusi ditambahkan.");
}

export async function deleteGoalContributionAction(formData: FormData) {
  const parsed = goalContributionDeleteSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectGoalsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await deleteGoalContribution(supabase, user.id, parsed.data.id, parsed.data.goal_id);

  if (error) redirectGoalsWithError(error.message || "Kontribusi belum bisa dihapus.");

  revalidatePath("/goals");
  redirectGoalsWithMessage("Kontribusi dihapus.");
}
