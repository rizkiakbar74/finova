"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { completeRealOnboarding } from "@/lib/services/onboarding";
import { firstZodError, formDataToObject } from "@/lib/utils/form";
import { getURL, safeRedirectPath } from "@/lib/utils/url";
import { loginSchema, realOnboardingSchema, signupSchema } from "@/lib/validators/auth.schema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

async function getProfileOnboardingCompleted(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.onboarding_completed === true;
}

export async function signInAction(formData: FormData) {
  const parsed = loginSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectWithError("/login", firstZodError(parsed.error));
  }

  const redirectTo = safeRedirectPath(String(formData.get("redirectTo") || ""));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirectWithError("/login", "Email atau password salah.");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && (await getProfileOnboardingCompleted(user.id))) {
    redirect(redirectTo);
  }

  redirect("/onboarding");
}

export async function signUpAction(formData: FormData) {
  const parsed = signupSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectWithError("/signup", firstZodError(parsed.error));
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") || getURL();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/onboarding`,
      data: {
        full_name: parsed.data.full_name,
        onboarding_completed: false
      }
    }
  });

  if (error) {
    redirectWithError("/signup", error.message || "Akun belum bisa dibuat.");
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirectWithMessage("/login", "Akun dibuat. Cek email jika konfirmasi aktif, lalu masuk.");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirectWithMessage("/login", "Kamu sudah keluar.");
}

export async function completeTemporaryOnboardingAction() {
  redirect("/onboarding");
}

export async function completeOnboardingAction(formData: FormData) {
  const parsed = realOnboardingSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirectWithError("/onboarding", firstZodError(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result = await completeRealOnboarding(supabase, user, parsed.data);

  if (result.error) {
    redirectWithError("/onboarding", result.error || "Onboarding belum bisa diselesaikan. Silakan coba lagi.");
  }

  redirect("/dashboard");
}
