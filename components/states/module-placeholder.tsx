import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionHref?: string;
  actionLabel?: string;
}

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  actionHref = "/dashboard",
  actionLabel = "Kembali ke dashboard"
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button asChild variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Status akses"
          value="Aman"
          description="Hanya pengguna yang sudah login dan selesai onboarding yang dapat membuka halaman ini."
          icon={Icon}
          tone="success"
          badge="Siap"
        />
        <KpiCard
          title="Kebijakan data"
          value="Tanpa data palsu"
          description="Data keuangan hanya berasal dari akun pengguna yang sedang aktif."
          tone="default"
        />
        <KpiCard
          title="Status modul"
          value="Tersedia"
          description="Halaman ini sudah masuk navigasi dan siap digunakan sesuai kebutuhan fitur."
          tone="warning"
        />
      </section>

      <EmptyState
        title={`${title} belum tersedia`}
        description="Halaman ini sudah diamankan dan masuk navigasi. Konten akan ditampilkan saat modul sudah diaktifkan."
        actionLabel={actionLabel}
        actionHref={actionHref}
        icon={<Icon className="h-5 w-5" />}
      />
    </div>
  );
}
