"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  LoaderCircle,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export {
  PasswordInput,
  RequiredFieldsNotice,
  RequiredLabel,
} from "@/components/shared/form-fields";
export { LoadingState } from "@/components/shared/loading-state";

export async function apiRequest(url, options) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const hasFieldErrors = Object.keys(payload.details?.fieldErrors ?? {}).length > 0;
    throw new Error(
      [
        payload.error ?? `La requête a échoué (${response.status}).`,
        ...(hasFieldErrors ? ["Vérifiez les champs signalés."] : []),
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
  return payload;
}

export function notifyToast(message, type = "success") {
  window.dispatchEvent(
    new CustomEvent("orthoconnect:toast", { detail: { message, type } }),
  );
}

export function ToastViewport() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    function showToast(event) {
      setToast({ ...event.detail, id: Date.now() });
    }

    window.addEventListener("orthoconnect:toast", showToast);
    return () => window.removeEventListener("orthoconnect:toast", showToast);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!toast) return null;
  const Icon = toast.type === "error" ? TriangleAlert : CheckCircle2;

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className="fixed bottom-4 end-4 z-[100] flex max-w-sm items-center gap-3 rounded-xl border border-line bg-surface p-4 text-fg shadow-xl"
    >
      <Icon
        className={`size-5 shrink-0 ${toast.type === "error" ? "text-danger" : "text-success"}`}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm">{toast.message}</p>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Fermer la notification"
        onClick={() => setToast(null)}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-surface p-6 text-fg shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fermer"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmer",
  variant = "default",
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  return (
    <Modal title={title} onClose={() => !isLoading && onCancel()}>
      <div className="space-y-5">
        <p className="text-sm text-muted">{description}</p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onCancel}
          >
            <X aria-hidden="true" />
            Annuler
          </Button>
          <Button
            type="button"
            variant={variant}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {!isLoading && <Check aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function StatusBadge({ status }) {
  const variant = {
    paid: "success",
    active: "success",
    trialing: "info",
    pending: "warning",
    past_due: "danger",
    cancelled: "danger",
    failed: "danger",
    canceled: "danger",
    inactive: "warning",
    suspended: "danger",
    expired: "warning",
    unpaid: "warning",
    unknown: "info",
  }[status] ?? "primary";
  const labels = {
    paid: "Payé",
    active: "Actif",
    trialing: "En essai",
    pending: "En attente",
    past_due: "En retard",
    cancelled: "Annulé",
    canceled: "Annulé",
    failed: "Échoué",
    inactive: "Inactif",
    suspended: "Suspendu",
    expired: "Expiré",
    unpaid: "Non payé",
    unknown: "Non applicable",
  };
  const descriptions = {
    paid: "Paiement reçu.",
    active: "Actif.",
    trialing: "Période d’essai en cours.",
    pending: "Facture en attente de paiement.",
    past_due: "Échéance de paiement dépassée.",
    cancelled: "Abonnement annulé.",
    canceled: "Abonnement annulé.",
    failed: "Paiement échoué.",
    inactive: "Inactif.",
    suspended: "Cabinet suspendu.",
    expired: "Période expirée.",
    unpaid: "Paiement non reçu.",
    unknown: "Statut indisponible.",
  };
  return (
    <Badge variant={variant} title={descriptions[status] ?? status ?? "Statut inconnu"}>
      {labels[status] ?? status ?? "—"}
    </Badge>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
      {message}
    </p>
  );
}

export function formatMad(amount) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
  }).format(Number(amount ?? 0));
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}
