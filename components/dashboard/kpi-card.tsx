import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const toneClasses = {
  default: "bg-slate-50 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700"
};

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  tone = "default",
  className
}: KpiCardProps) {
  return (
    <Card className={cn("bg-white", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClasses[tone])}>
            {Icon ? <Icon className="h-4 w-4" /> : <span className="text-base font-medium">•</span>}
          </div>
          {badge ? <Badge variant={tone === "default" ? "secondary" : tone}>{badge}</Badge> : null}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 break-words text-xl font-medium tracking-normal text-slate-950">{value}</p>
          {description ? <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
