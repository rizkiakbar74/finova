import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref, icon, className }: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed bg-white/70", className)}>
      <CardContent className="flex flex-col items-center justify-center p-10 text-center sm:p-14">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon || "✦"}
        </div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {actionLabel && actionHref ? (
          <Button asChild className="mt-6">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
