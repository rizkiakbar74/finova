import { cn } from "@/lib/utils";

interface AuthAlertProps {
  error?: string;
  message?: string;
}

export function AuthAlert({ error, message }: AuthAlertProps) {
  if (!error && !message) return null;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      {error || message}
    </div>
  );
}
