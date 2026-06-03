import { CalendarDays } from "lucide-react";
import { ModulePlaceholder } from "@/components/states/module-placeholder";

export default function CalendarPage() {
  return (
    <ModulePlaceholder
      title="Kalender"
      description="Kalender keuangan akan menampilkan transaksi, tagihan, langganan, dan target dalam satu jadwal."
      icon={CalendarDays}
    />
  );
}
