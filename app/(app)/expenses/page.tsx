import { TrendingDown } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";

export default function ExpensesPage() {
  return (
    <ModulePlaceholder
      title="Pengeluaran"
      description="Pantau pengeluaran harian dan kebiasaan belanja dari halaman yang aman untuk akun Anda."
      icon={TrendingDown}
    />
  );
}
