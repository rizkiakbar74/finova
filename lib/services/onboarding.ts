import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { RealOnboardingInput } from "@/lib/validators/auth.schema";

interface ServiceResult {
  error: string | null;
}

export async function completeRealOnboarding(
  supabase: SupabaseClient,
  user: User,
  input: RealOnboardingInput
): Promise<ServiceResult> {
  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    return { error: profileReadError.message || "Profil belum bisa dibaca." };
  }

  if (!profile) {
    return { error: "Profil belum siap. Silakan keluar, masuk lagi, lalu coba kembali." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      onboarding_completed: true
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message || "Profil belum bisa diperbarui." };
  }

  const { error: settingsError } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      currency: input.currency,
      timezone: input.timezone,
      language: "id",
      theme: "light"
    },
    { onConflict: "user_id" }
  );

  if (settingsError) {
    return { error: settingsError.message || "Preferensi belum bisa disimpan." };
  }

  const { error: categoriesError } = await supabase.rpc("create_default_categories", {
    target_user_id: user.id
  });

  if (categoriesError) {
    return { error: categoriesError.message || "Kategori bawaan belum bisa dibuat." };
  }

  const { data: existingWallets, error: walletCheckError } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .limit(1);

  if (walletCheckError) {
    return { error: walletCheckError.message || "Dompet belum bisa dicek." };
  }

  if (!existingWallets || existingWallets.length === 0) {
    const { error: walletInsertError } = await supabase.from("wallets").insert({
      user_id: user.id,
      name: input.wallet_name,
      type: input.wallet_type,
      initial_balance: input.initial_balance,
      currency: input.currency,
      color: "#10B981",
      icon: "wallet"
    });

    if (walletInsertError) {
      return { error: walletInsertError.message || "Dompet awal belum bisa dibuat." };
    }
  }

  await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      full_name: input.full_name,
      onboarding_completed: true
    }
  });

  return { error: null };
}
