import { NextResponse } from "next/server";
import { deleteBudgetItem, updateBudgetItem } from "@/lib/repositories/budgets";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/utils/form";
import { budgetItemDeleteSchema, budgetItemUpdateSchema, uuidSchema } from "@/lib/validators/finance.schema";

interface BudgetItemRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: BudgetItemRouteContext) {
  const { id } = await context.params;
  const idParsed = uuidSchema.safeParse(id);

  if (!idParsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: firstZodError(idParsed.error) } },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
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

  const parsed = budgetItemUpdateSchema.safeParse({ ...(body as Record<string, unknown>), id: idParsed.data });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: firstZodError(parsed.error) } },
      { status: 400 }
    );
  }

  const { data, error } = await updateBudgetItem(supabase, user.id, parsed.data);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request, context: BudgetItemRouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const parsed = budgetItemDeleteSchema.safeParse({
    id,
    budget_id: url.searchParams.get("budget_id")
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: firstZodError(parsed.error) } },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } },
      { status: 401 }
    );
  }

  const { error } = await deleteBudgetItem(supabase, user.id, parsed.data.id, parsed.data.budget_id);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { id: parsed.data.id, deleted: true } });
}
