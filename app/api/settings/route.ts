import { NextResponse } from "next/server";
import { getUserSettings, updateUserSettings } from "@/lib/services/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/utils/form";
import { userSettingsUpdateSchema } from "@/lib/validators/finance.schema";

async function getAuthenticatedContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedContext();

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } },
      { status: 401 }
    );
  }

  const { data, error } = await getUserSettings(supabase, user.id);

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error || "Pengaturan belum bisa dimuat." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedContext();

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  const parsed = userSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: firstZodError(parsed.error) } },
      { status: 400 }
    );
  }

  const { error } = await updateUserSettings(supabase, user.id, parsed.data);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error } },
      { status: 500 }
    );
  }

  const { data } = await getUserSettings(supabase, user.id);
  return NextResponse.json({ success: true, data });
}
