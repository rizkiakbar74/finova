import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSettingsUpdateInput } from "@/lib/validators/finance.schema";

export interface SettingsData {
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    plan_type: "free" | "premium" | "lifetime";
    onboarding_completed: boolean;
  };
  settings: {
    currency: string;
    language: string;
    theme: "light" | "dark" | "system";
    timezone: string | null;
    date_format: string | null;
  };
  notifications: {
    budget_alerts: boolean;
    bill_reminders: boolean;
    goal_milestones: boolean;
    subscription_renewals: boolean;
    security_alerts: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
  };
}

export async function getUserSettings(supabase: SupabaseClient, userId: string) {
  const [{ data: profile, error: profileError }, { data: settings, error: settingsError }, { data: notifications, error: notificationsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, plan_type, onboarding_completed")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("user_settings")
        .select("currency, language, theme, timezone, date_format")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("notification_preferences")
        .select(
          "budget_alerts, bill_reminders, goal_milestones, subscription_renewals, security_alerts, quiet_hours_enabled, quiet_hours_start, quiet_hours_end"
        )
        .eq("user_id", userId)
        .maybeSingle()
    ]);

  if (profileError) return { data: null, error: profileError.message };
  if (settingsError) return { data: null, error: settingsError.message };
  if (notificationsError) return { data: null, error: notificationsError.message };
  if (!profile) return { data: null, error: "Profil belum siap." };

  return {
    data: {
      profile,
      settings: {
        currency: settings?.currency || "IDR",
        language: settings?.language || "id",
        theme: settings?.theme || "light",
        timezone: settings?.timezone || "Asia/Jakarta",
        date_format: settings?.date_format || "YYYY-MM-DD"
      },
      notifications: {
        budget_alerts: notifications?.budget_alerts ?? true,
        bill_reminders: notifications?.bill_reminders ?? true,
        goal_milestones: notifications?.goal_milestones ?? true,
        subscription_renewals: notifications?.subscription_renewals ?? true,
        security_alerts: notifications?.security_alerts ?? true,
        quiet_hours_enabled: notifications?.quiet_hours_enabled ?? false,
        quiet_hours_start: notifications?.quiet_hours_start || null,
        quiet_hours_end: notifications?.quiet_hours_end || null
      }
    } satisfies SettingsData,
    error: null
  };
}

export async function updateUserSettings(
  supabase: SupabaseClient,
  userId: string,
  input: UserSettingsUpdateInput
) {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      avatar_url: input.avatar_url ?? null
    })
    .eq("id", userId);

  if (profileError) return { error: profileError.message };

  const { error: settingsError } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      currency: input.currency,
      language: input.language,
      theme: input.theme,
      timezone: input.timezone,
      date_format: input.date_format
    },
    { onConflict: "user_id" }
  );

  if (settingsError) return { error: settingsError.message };

  const { error: notificationsError } = await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      budget_alerts: input.budget_alerts,
      bill_reminders: input.bill_reminders,
      goal_milestones: input.goal_milestones,
      subscription_renewals: input.subscription_renewals,
      security_alerts: input.security_alerts,
      quiet_hours_enabled: input.quiet_hours_enabled,
      quiet_hours_start: input.quiet_hours_start ?? null,
      quiet_hours_end: input.quiet_hours_end ?? null
    },
    { onConflict: "user_id" }
  );

  if (notificationsError) return { error: notificationsError.message };

  await supabase.auth.updateUser({
    data: {
      full_name: input.full_name
    }
  });

  return { error: null };
}
