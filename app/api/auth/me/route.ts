import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource."
        }
      },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, plan_type, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      plan_type: profile?.plan_type ?? "free",
      onboarding_completed: profile?.onboarding_completed === true
    }
  });
}
