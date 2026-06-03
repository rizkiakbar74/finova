"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "The page could not be loaded. Please try again.",
  actionLabel = "Try again",
  onAction
}: ErrorStateProps) {
  return (
    <Card className="border-red-100 bg-white">
      <CardContent className="flex flex-col items-center justify-center p-10 text-center sm:p-14">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {onAction ? (
          <Button type="button" className="mt-6" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
