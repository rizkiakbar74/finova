"use client";

import { ErrorState } from "@/components/states/error-state";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="Halaman tidak dapat dimuat"
      description="Halaman ini aman, tetapi terjadi kendala saat menampilkan konten."
      actionLabel="Reload page"
      onAction={reset}
    />
  );
}
