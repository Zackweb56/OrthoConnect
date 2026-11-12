import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Chargement des données…" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-32 flex-col items-center justify-center gap-3 text-sm text-muted"
    >
      <LoaderCircle className="size-6 animate-spin text-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
