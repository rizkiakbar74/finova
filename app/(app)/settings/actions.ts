"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import { updateUserSettings } from "@/lib/services/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError, formDataToObject } from "@/lib/utils/form";
import { userSettingsUpdateSchema } from "@/lib/validators/finance.schema";

function redirectSettingsWithError(message: string): never {
  redirect(`/settings?error=${encodeURIComponent(message)}`);
}

function redirectSettingsWithMessage(message: string): never {
  redirect(`/settings?message=${encodeURIComponent(message)}`);
}

export async function updateSettingsAction(formData: FormData) {
  const parsed = userSettingsUpdateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) redirectSettingsWithError(firstZodError(parsed.error));

  const user = await requireOnboardedUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await updateUserSettings(supabase, user.id, parsed.data);

  if (error) redirectSettingsWithError(error || "Pengaturan belum bisa diperbarui.");

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirectSettingsWithMessage("Pengaturan diperbarui.");
}
