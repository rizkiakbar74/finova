import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  unreadNotificationCount?: number;
}

export function AppShell({ children, userEmail, unreadNotificationCount = 0 }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="flex min-h-screen min-w-0">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          <AppTopbar email={userEmail} unreadNotificationCount={unreadNotificationCount} />
          <main className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-1 flex-col overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
