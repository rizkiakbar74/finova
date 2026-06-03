import { NextResponse } from "next/server";
import { listNotifications, markAllNotificationsRead } from "@/lib/services/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } }, { status: 401 });

  const { data, error } = await listNotifications(supabase, user.id);
  if (error) return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in." } }, { status: 401 });

  const { error } = await markAllNotificationsRead(supabase, user.id);
  if (error) return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data: { read: true } });
}
