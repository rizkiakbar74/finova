import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/(auth)/actions";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-950">
        Keluar
      </Button>
    </form>
  );
}
