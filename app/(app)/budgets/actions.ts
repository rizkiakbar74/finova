"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import {
  createBudget,
  createBudgetItem,
  deleteBudgetItem,
  softDeleteBudget,
  updateBudget,
  updateBudgetItem
} from "@/lib/repositories/budgets";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError, formDataToObject } from "@/lib/utils/form";
import {
  budgetCreateSchema,
  budgetDeleteSchema,
  budgetItemCreateSchema,
  budgetItemDeleteSchema,
  budgetItemUpdateSchema,
  budgetUpdateSchema
} from "@/lib/validators/finance.schema";

function redirectBudgetsWithError(message: string): never {
  redirect(`/budgets?error=${encodeURIComponent(message)}`);
}

function redirectBudgetsWithMessage(message: string): never {
  redirect(`/budgets?message=${encodeURIComponent(message)}`);
}

async function getActionContext() {
  const user = await requireOnboardedUser();
  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

export async function createBudgetAction(formData: FormData) {
  const parsed = budgetCreateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectBudgetsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await createBudget(supabase, user.id, parsed.data);

  if (error) redirectBudgetsWithError(error.message || "Anggaran belum bisa dibuat.");

  revalidatePath("/budgets");
  redirectBudgetsWithMessage("Anggaran dibuat.");
}

export async function updateBudgetAction(formData: FormData) {
  const parsed = budgetUpdateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectBudgetsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await updateBudget(supabase, user.id, parsed.data);

  if (error) redirectBudgetsWithError(error.message || "Anggaran belum bisa diperbarui.");

  revalidatePath("/budgets");
  redirectBudgetsWithMessage("Anggaran diperbarui.");
}

export async function deleteBudgetAction(formData: FormData) {
  const parsed = budgetDeleteSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectBudgetsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await softDeleteBudget(supabase, user.id, parsed.data.id);

  if (error) redirectBudgetsWithError(error.message || "Anggaran belum bisa dihapus.");

  revalidatePath("/budgets");
  redirectBudgetsWithMessage("Anggaran dihapus.");
}

export async function createBudgetItemAction(formData: FormData) {
  const parsed = budgetItemCreateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectBudgetsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await createBudgetItem(supabase, user.id, parsed.data);

  if (error) redirectBudgetsWithError(error.message || "Batas kategori anggaran belum bisa dibuat.");

  revalidatePath("/budgets");
  redirectBudgetsWithMessage("Batas kategori anggaran dibuat.");
}

export async function updateBudgetItemAction(formData: FormData) {
  const parsed = budgetItemUpdateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectBudgetsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await updateBudgetItem(supabase, user.id, parsed.data);

  if (error) redirectBudgetsWithError(error.message || "Batas kategori anggaran belum bisa diperbarui.");

  revalidatePath("/budgets");
  redirectBudgetsWithMessage("Batas kategori anggaran diperbarui.");
}

export async function deleteBudgetItemAction(formData: FormData) {
  const parsed = budgetItemDeleteSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectBudgetsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await deleteBudgetItem(supabase, user.id, parsed.data.id, parsed.data.budget_id);

  if (error) redirectBudgetsWithError(error.message || "Batas kategori anggaran belum bisa dihapus.");

  revalidatePath("/budgets");
  redirectBudgetsWithMessage("Batas kategori anggaran dihapus.");
}
