import { AppShell } from "@/components/layout/app-shell";
import { requireOnboardedUser } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/services/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOnboardedUser();
  const supabase = await createSupabaseServerClient();
  const unreadNotificationCount = await getUnreadNotificationCount(supabase, user.id);

  return <AppShell userEmail={user.email} unreadNotificationCount={unreadNotificationCount}>{children}</AppShell>;
}
