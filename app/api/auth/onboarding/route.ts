import { createSupabaseServerClient } from "@/lib/supabase/server";
import { completeRealOnboarding } from "@/lib/services/onboarding";
import { firstZodError } from "@/lib/utils/form";
import { realOnboardingSchema } from "@/lib/validators/auth.schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body must be valid JSON."
        }
      },
      { status: 400 }
    );
  }

  const parsed = realOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: firstZodError(parsed.error)
        }
      },
      { status: 400 }
    );
  }

  const result = await completeRealOnboarding(supabase, user, parsed.data);
  if (result.error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: result.error
        }
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      onboarding_completed: true
    }
  });
}
