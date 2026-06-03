import { NextResponse } from "next/server";
import { defaultDashboardRange, getDashboardData } from "@/lib/services/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/utils/form";
import { dashboardRangeSchema } from "@/lib/validators/finance.schema";

async function getAuthenticatedContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedContext();

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const rangeInput = Object.fromEntries(url.searchParams.entries());
  const parsedRange = dashboardRangeSchema.safeParse(
    rangeInput.date_from && rangeInput.date_to ? rangeInput : defaultDashboardRange()
  );

  if (!parsedRange.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: firstZodError(parsedRange.error) } },
      { status: 400 }
    );
  }

  const { data, error } = await getDashboardData(supabase, user.id, parsedRange.data);

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error || "Kategori pengeluaran belum bisa dimuat." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data.spendingByCategory, meta: { range: data.range } });
}
