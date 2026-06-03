import { NextResponse } from "next/server";
import { softDeleteCategory, updateCategory } from "@/lib/repositories/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/utils/form";
import { categoryUpdateSchema, uuidSchema } from "@/lib/validators/finance.schema";

interface CategoryRouteContext {
  params: Promise<{
    id: string;
  }>;
}

async function getAuthenticatedContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function PATCH(request: Request, context: CategoryRouteContext) {
  const { id } = await context.params;
  const idParsed = uuidSchema.safeParse(id);

  if (!idParsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: firstZodError(idParsed.error) } },
      { status: 400 }
    );
  }

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

  const parsed = categoryUpdateSchema.safeParse({ ...(body as Record<string, unknown>), id: idParsed.data });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: firstZodError(parsed.error) } },
      { status: 400 }
    );
  }

  const { data, error } = await updateCategory(supabase, user.id, parsed.data);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(_request: Request, context: CategoryRouteContext) {
  const { id } = await context.params;
  const idParsed = uuidSchema.safeParse(id);

  if (!idParsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: firstZodError(idParsed.error) } },
      { status: 400 }
    );
  }

  const { supabase, user } = await getAuthenticatedContext();

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } },
      { status: 401 }
    );
  }

  const { error } = await softDeleteCategory(supabase, user.id, idParsed.data);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { id: idParsed.data, deleted: true } });
}
