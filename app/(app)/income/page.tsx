import { TrendingUp } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";

export default function IncomePage() {
  return (
    <ModulePlaceholder
      title="Pemasukan"
      description="Kelola pemasukan rutin dan pemasukan tambahan dari halaman yang aman untuk akun Anda."
      icon={TrendingUp}
    />
  );
}
