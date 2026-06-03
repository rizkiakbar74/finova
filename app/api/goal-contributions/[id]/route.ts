import { NextResponse } from "next/server";
import { deleteGoalContribution } from "@/lib/repositories/goals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/utils/form";
import { goalContributionDeleteSchema } from "@/lib/validators/finance.schema";

interface GoalContributionRouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, context: GoalContributionRouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const parsed = goalContributionDeleteSchema.safeParse({
    id,
    goal_id: url.searchParams.get("goal_id")
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

  const { error } = await deleteGoalContribution(supabase, user.id, parsed.data.id, parsed.data.goal_id);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { id: parsed.data.id, deleted: true } });
}
