"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import {
  createTransaction,
  softDeleteTransaction,
  updateTransaction
} from "@/lib/repositories/transactions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError, formDataToObject } from "@/lib/utils/form";
import {
  transactionCreateSchema,
  transactionDeleteSchema,
  transactionUpdateSchema
} from "@/lib/validators/finance.schema";

function redirectTransactionsWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function redirectTransactionsWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

async function getActionContext() {
  const user = await requireOnboardedUser();
  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

export async function createTransactionAction(formData: FormData) {
  const parsed = transactionCreateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectTransactionsWithError("/transactions/new", firstZodError(parsed.error));
  }

  const { user, supabase } = await getActionContext();
  const { error } = await createTransaction(supabase, user.id, parsed.data);

  if (error) {
    redirectTransactionsWithError("/transactions/new", error.message || "Transaksi belum bisa dibuat.");
  }

  revalidatePath("/transactions");
  redirectTransactionsWithMessage("/transactions", "Transaksi dibuat.");
}

export async function updateTransactionAction(formData: FormData) {
  const parsed = transactionUpdateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectTransactionsWithError("/transactions", firstZodError(parsed.error));
  }

  const { user, supabase } = await getActionContext();
  const { error } = await updateTransaction(supabase, user.id, parsed.data);

  if (error) {
    redirectTransactionsWithError("/transactions", error.message || "Transaksi belum bisa diperbarui.");
  }

  revalidatePath("/transactions");
  redirectTransactionsWithMessage("/transactions", "Transaksi diperbarui.");
}

export async function deleteTransactionAction(formData: FormData) {
  const parsed = transactionDeleteSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectTransactionsWithError("/transactions", firstZodError(parsed.error));
  }

  const { user, supabase } = await getActionContext();
  const { error } = await softDeleteTransaction(supabase, user.id, parsed.data.id);

  if (error) {
    redirectTransactionsWithError("/transactions", error.message || "Transaksi belum bisa dihapus.");
  }

  revalidatePath("/transactions");
  redirectTransactionsWithMessage("/transactions", "Transaksi dihapus.");
}
