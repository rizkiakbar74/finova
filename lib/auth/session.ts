import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export interface CurrentProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan_type: "free" | "premium" | "lifetime";
  onboarding_completed: boolean;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) return null;
  return user;
}

export async function getCurrentProfile(user: User) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, plan_type, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as CurrentProfile;
}

export async function isUserOnboardingCompleted(user: User | null) {
  if (!user) return false;

  const profile = await getCurrentProfile(user);

  // After the database setup is installed, profiles is the source of truth.
  if (profile) return profile.onboarding_completed === true;

  // Fallback only for projects that have not installed the database yet.
  return user.user_metadata?.onboarding_completed === true;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireOnboardedUser() {
  const user = await requireUser();
  const completed = await isUserOnboardingCompleted(user);

  if (!completed) {
    redirect("/onboarding");
  }

  return user;
}
