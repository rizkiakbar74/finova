"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import {
  createCategory,
  softDeleteCategory,
  updateCategory,
} from "@/lib/repositories/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError, formDataToObject } from "@/lib/utils/form";
import {
  categoryCreateSchema,
  categoryDeleteSchema,
  categoryUpdateSchema,
  walletCreateSchema,
  walletDeleteSchema,
  walletUpdateSchema
} from "@/lib/validators/finance.schema";
import { createWallet as createWalletRecord, updateWallet as updateWalletRecord, softDeleteWallet as softDeleteWalletRecord } from "@/lib/repositories/wallets";

function redirectWalletsWithError(message: string): never {
  redirect(`/wallets?error=${encodeURIComponent(message)}`);
}

function redirectWalletsWithMessage(message: string): never {
  redirect(`/wallets?message=${encodeURIComponent(message)}`);
}

async function getActionContext() {
  const user = await requireOnboardedUser();
  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

export async function createWalletAction(formData: FormData) {
  const parsed = walletCreateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectWalletsWithError(firstZodError(parsed.error));
  }

  const { user, supabase } = await getActionContext();
  const { error } = await createWalletRecord(supabase, user.id, parsed.data);

  if (error) {
    redirectWalletsWithError(error.message || "Dompet belum bisa dibuat.");
  }

  revalidatePath("/wallets");
  redirectWalletsWithMessage("Dompet dibuat.");
}

export async function updateWalletAction(formData: FormData) {
  const parsed = walletUpdateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectWalletsWithError(firstZodError(parsed.error));
  }

  const { user, supabase } = await getActionContext();
  const { error } = await updateWalletRecord(supabase, user.id, parsed.data);

  if (error) {
    redirectWalletsWithError(error.message || "Dompet belum bisa diperbarui.");
  }

  revalidatePath("/wallets");
  redirectWalletsWithMessage("Dompet diperbarui.");
}

export async function deleteWalletAction(formData: FormData) {
  const parsed = walletDeleteSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectWalletsWithError(firstZodError(parsed.error));
  }

  const { user, supabase } = await getActionContext();
  const { error } = await softDeleteWalletRecord(supabase, user.id, parsed.data.id);

  if (error) {
    redirectWalletsWithError(error.message || "Dompet belum bisa dihapus.");
  }

  revalidatePath("/wallets");
  redirectWalletsWithMessage("Dompet dihapus.");
}

export async function createCategoryAction(formData: FormData) {
  const parsed = categoryCreateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectWalletsWithError(firstZodError(parsed.error));
  }

  const { user, supabase } = await getActionContext();
  const { error } = await createCategory(supabase, user.id, parsed.data);

  if (error) {
    redirectWalletsWithError(error.message || "Kategori belum bisa dibuat.");
  }

  revalidatePath("/wallets");
  redirectWalletsWithMessage("Kategori dibuat.");
}

export async function updateCategoryAction(formData: FormData) {
  const parsed = categoryUpdateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectWalletsWithError(firstZodError(parsed.error));
  }

  const { user, supabase } = await getActionContext();
  const { error } = await updateCategory(supabase, user.id, parsed.data);

  if (error) {
    redirectWalletsWithError(error.message || "Kategori belum bisa diperbarui.");
  }

  revalidatePath("/wallets");
  redirectWalletsWithMessage("Kategori diperbarui.");
}

export async function deleteCategoryAction(formData: FormData) {
  const parsed = categoryDeleteSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectWalletsWithError(firstZodError(parsed.error));
  }

  const { user, supabase } = await getActionContext();
  const { error } = await softDeleteCategory(supabase, user.id, parsed.data.id);

  if (error) {
    redirectWalletsWithError(error.message || "Kategori belum bisa dihapus.");
  }

  revalidatePath("/wallets");
  redirectWalletsWithMessage("Kategori dihapus.");
}
