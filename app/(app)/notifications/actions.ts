"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import {
  archiveNotification,
  markAllNotificationsRead,
  markNotificationRead
} from "@/lib/services/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError, formDataToObject } from "@/lib/utils/form";
import { notificationUpdateSchema } from "@/lib/validators/finance.schema";

function redirectNotificationsWithError(message: string): never {
  redirect(`/notifications?error=${encodeURIComponent(message)}`);
}

function redirectNotificationsWithMessage(message: string): never {
  redirect(`/notifications?message=${encodeURIComponent(message)}`);
}

async function getActionContext() {
  const user = await requireOnboardedUser();
  const supabase = await createSupabaseServerClient();
  return { user, supabase };
}

export async function markNotificationReadAction(formData: FormData) {
  const parsed = notificationUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) redirectNotificationsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await markNotificationRead(supabase, user.id, parsed.data.id);
  if (error) redirectNotificationsWithError(error.message || "Notifikasi belum bisa ditandai sudah dibaca.");

  revalidatePath("/notifications");
  redirectNotificationsWithMessage("Notifikasi ditandai sudah dibaca.");
}

export async function archiveNotificationAction(formData: FormData) {
  const parsed = notificationUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) redirectNotificationsWithError(firstZodError(parsed.error));

  const { user, supabase } = await getActionContext();
  const { error } = await archiveNotification(supabase, user.id, parsed.data.id);
  if (error) redirectNotificationsWithError(error.message || "Notifikasi belum bisa diarsipkan.");

  revalidatePath("/notifications");
  redirectNotificationsWithMessage("Notifikasi diarsipkan.");
}

export async function markAllNotificationsReadAction() {
  const { user, supabase } = await getActionContext();
  const { error } = await markAllNotificationsRead(supabase, user.id);
  if (error) redirectNotificationsWithError(error.message || "Notifikasi belum bisa ditandai sudah dibaca.");

  revalidatePath("/notifications");
  redirectNotificationsWithMessage("Semua notifikasi ditandai sudah dibaca.");
}
