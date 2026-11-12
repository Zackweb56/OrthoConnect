"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import {
  ConfirmDialog,
  ErrorBanner,
  LoadingState,
  Modal,
  RequiredFieldsNotice,
  RequiredLabel,
  StatusBadge,
  apiRequest,
  formatDate,
  formatDateTime,
  formatMad,
  notifyToast,
} from "./shared";

const emptyData = {
  clinic: null,
  subscription: null,
  payments: [],
  totalPayments: 0,
  page: 1,
  pageSize: 10,
  activePlans: [],
  hasPendingPayment: false,
  isPlanLocked: false,
  currentPeriod: null,
  nextPeriod: null,
  currentPeriodPaymentStatus: "unknown",
};

export function OwnerClinicDetails({ slug }) {
  const [data, setData] = useState(emptyData);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    method: "cash",
    reference: "",
    notes: "",
  });
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const loadClinic = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      search,
      status: paymentStatus,
      sortBy,
      sortDirection,
    });
    return apiRequest(
      `/api/owner/clinics/${encodeURIComponent(slug)}?${params}`,
    );
  }, [page, paymentStatus, search, slug, sortBy, sortDirection]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadClinic()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setSelectedPlan((current) => current || result.subscription?.planId || "");
        if (result.subscription) {
          setInvoiceAmount(String(result.subscription.plan.price));
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadClinic, refresh]);

  async function assignPlan(event) {
    event.preventDefault();
    setError("");
    setIsConfirming(true);
    try {
      const result = await apiRequest(
        `/api/owner/clinics/${data.clinic.id}/assign-plan`,
        {
          method: "POST",
          body: JSON.stringify({ planId: selectedPlan }),
        },
      );
      notifyToast(
        result.isTrial
          ? "Le plan d’essai a été activé pour ce cabinet."
          : "Le plan a été attribué au cabinet.",
      );
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsConfirming(false);
    }
  }

  function cancelSubscription() {
    setError("");
    setPendingAction({ type: "cancel-subscription" });
  }

  function openCreateInvoice() {
    setError("");
    setInvoiceAmount(String(subscription?.plan.price ?? ""));
    setInvoiceNotes("");
    setIsInvoiceOpen(true);
  }

  async function createInvoice(event) {
    event.preventDefault();
    setError("");
    setIsConfirming(true);
    try {
      await apiRequest(`/api/owner/clinics/${data.clinic.id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(invoiceAmount),
          notes: invoiceNotes || null,
        }),
      });
      setIsInvoiceOpen(false);
      notifyToast("La facture en attente a été créée.");
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsConfirming(false);
    }
  }

  async function submitMarkAsPaid(event) {
    event.preventDefault();
    setError("");
    setIsConfirming(true);
    try {
      await apiRequest(
        `/api/owner/clinics/${data.clinic.id}/payments/${selectedPayment.id}/mark-paid`,
        {
          method: "POST",
          body: JSON.stringify(paymentForm),
        },
      );
      setSelectedPayment(null);
      setPaymentForm({ method: "cash", reference: "", notes: "" });
      notifyToast("Le paiement a été enregistré.");
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsConfirming(false);
    }
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setIsConfirming(true);
    setError("");
    try {
      if (pendingAction.type === "cancel-subscription") {
        await apiRequest(
          `/api/owner/clinics/${data.clinic.id}/cancel-subscription`,
          { method: "POST", body: JSON.stringify({ confirm: true }) },
        );
        notifyToast("L’abonnement a été annulé.");
      } else {
        await apiRequest(
          `/api/owner/clinics/${data.clinic.id}/payments/${pendingAction.payment.id}`,
          { method: "DELETE" },
        );
        notifyToast("La facture a été supprimée.");
      }
      setPendingAction(null);
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsConfirming(false);
    }
  }

  if (!data.clinic) {
    return (
      <section className="space-y-4">
        <ErrorBanner message={error} />
        {!error && <LoadingState label="Chargement du cabinet…" />}
      </section>
    );
  }

  const subscription = data.subscription;
  const selectedPlanDetails = data.activePlans.find((plan) => plan.id === selectedPlan);
  const columns = [
    {
      key: "plan",
      label: "Plan",
      render: (payment) => payment.subscription.plan.name,
    },
    {
      key: "amount",
      label: "Montant",
      sortable: true,
      render: (payment) => formatMad(payment.amount),
    },
    { key: "status", label: "Statut", render: (payment) => <StatusBadge status={payment.status} /> },
    {
      key: "period",
      label: "Période facturée",
      render: (payment) =>
        payment.periodStartsAt && payment.periodEndsAt
          ? `${formatDate(payment.periodStartsAt)} – ${formatDate(payment.periodEndsAt)}`
          : "—",
    },
    {
      key: "method",
      label: "Mode de paiement",
      render: (payment) => <PaymentMethodBadge method={payment.method} />,
    },
    { key: "reference", label: "Référence" },
    {
      key: "created_at",
      label: "Créé le",
      sortable: true,
      render: (payment) => formatDateTime(payment.createdAt),
    },
    {
      key: "paid_at",
      label: "Payé le",
      sortable: true,
      render: (payment) => formatDateTime(payment.paidAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (payment) =>
        ["pending", "failed"].includes(payment.status) ? (
          <div className="flex items-center gap-1">
            {payment.status === "pending" && (
              <Button
                type="button"
                size="icon-lg"
                aria-label="Marquer cette facture comme payée"
                title="Marquer comme payé"
                onClick={() => {
                  setPaymentForm({ method: "cash", reference: "", notes: "" });
                  setSelectedPayment(payment);
                  setError("");
                }}
              >
                <BadgeCheck aria-hidden="true" />
              </Button>
            )}
            <Button
              type="button"
              size="icon-lg"
              variant="destructive"
              aria-label="Supprimer cette facture"
              title="Supprimer la facture"
              onClick={() => setPendingAction({ type: "delete-payment", payment })}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <section className="space-y-6">
      {/* Top Header with Back Button and Clinic Info */}
      <div className="flex flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">{data.clinic.name}</h2>
          <p className="text-sm text-muted">
            {[data.clinic.city, data.clinic.phone].filter(Boolean).join(" · ") ||
              "Informations de contact non renseignées"}
          </p>
        </div>

        <div>
          <Button
            type="button"
            variant="ghost" // Or "secondary"
            className="gap-1 -ml-2 sm:ml-0 text-muted hover:text-foreground"
            onClick={() => window.history.back()}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
      <ErrorBanner message={error} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abonnement actuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-base">{subscription.plan.name}</span>
                  <StatusBadge status={subscription.status} />
                </div>

                {/* Modern Unified Date Range & Duration Pill */}
                <div className="rounded-lg bg-surface-muted/50 p-3 border border-line/60 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted font-medium">Validité de l'abonnement</span>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {formatSubscriptionDuration(subscription.createdAt, subscription.endsAt)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span>{formatDate(subscription.createdAt)}</span>
                    <span className="text-muted">→</span>
                    <span>{formatDate(subscription.endsAt)}</span>
                  </div>
                </div>

                {subscription.trialEndsAt && (
                  <p className="text-xs text-muted">
                    Fin d’essai : {formatDate(subscription.trialEndsAt)}
                  </p>
                )}

                <div className="space-y-2 pt-1 border-t border-line/40 text-sm">
                  {data.currentPeriod && (
                    <div className="flex items-center justify-between text-muted">
                      <span>Période actuelle :</span>
                      <span className="font-medium text-foreground">
                        {formatDate(data.currentPeriod.periodStartsAt)} – {formatDate(data.currentPeriod.periodEndsAt)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-muted">
                    <span>Paiement période en cours :</span>
                    <StatusBadge status={data.currentPeriodPaymentStatus} />
                  </div>

                  {data.nextPeriod && (
                    <div className="flex items-center justify-between text-muted">
                      <span>Période suivante :</span>
                      <span className="font-medium text-foreground">
                        {formatDate(data.nextPeriod.periodStartsAt)} – {formatDate(data.nextPeriod.periodEndsAt)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Aucun abonnement.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Affecter un plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={assignPlan}>
              <div className="space-y-2">
                <RequiredLabel htmlFor="selected-plan" required>
                  Plan actif
                </RequiredLabel>
                <select
                  id="selected-plan"
                  required
                  value={selectedPlan}
                  disabled={data.isPlanLocked}
                  onChange={(event) => {
                    const planId = event.target.value;
                    const plan = data.activePlans.find((item) => item.id === planId);
                    setSelectedPlan(planId);
                    setInvoiceAmount(String(plan?.price ?? ""));
                  }}
                  className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm disabled:opacity-60"
                >
                  <option value="">Sélectionner un plan</option>
                  {data.activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} · {formatMad(plan.price)}
                    </option>
                  ))}
                </select>
                {data.isPlanLocked && (
                  <p className="text-sm text-warning">
                    Le plan est verrouillé jusqu’à la fin du cycle ou son annulation.
                  </p>
                )}
                {!data.isPlanLocked && selectedPlanDetails && (
                  <p className="text-sm text-muted">
                    {selectedPlanDetails.trialDays > 0
                      ? `Ce plan démarre automatiquement par un essai de ${selectedPlanDetails.trialDays} jours.`
                      : "Sans période d’essai, l’abonnement sera actif dès son attribution."}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={!selectedPlan || data.isPlanLocked || isConfirming}
                >
                  <CreditCard aria-hidden="true" />
                  {isConfirming ? "Attribution…" : "Attribuer le plan"}
                </Button>
                {subscription &&
                  data.isPlanLocked &&
                  ["active", "trialing"].includes(subscription.status) && (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isConfirming}
                      onClick={cancelSubscription}
                    >
                      <Ban aria-hidden="true" />
                      Annuler l’abonnement
                    </Button>
                  )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Historique des paiements</CardTitle>
          <Button
            type="button"
            disabled={
              !subscription ||
              subscription.status === "trialing" ||
              data.hasPendingPayment
            }
            onClick={openCreateInvoice}
          >
            <Plus aria-hidden="true" />
            Créer une facture
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-xs space-y-2">
            <Label htmlFor="clinic-payment-status">Statut</Label>
            <select
              id="clinic-payment-status"
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            >
              <option value="all">Tous les paiements</option>
              <option value="pending">En attente</option>
              <option value="paid">Payés</option>
            </select>
          </div>
          <DataTable
            columns={columns}
            rows={data.payments}
            total={data.totalPayments}
            page={data.page}
            pageSize={data.pageSize}
            search={search}
            sortBy={sortBy}
            sortDirection={sortDirection}
            isLoading={isLoading}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onSort={(column) => {
              setSortDirection((direction) =>
                sortBy === column && direction === "asc" ? "desc" : "asc",
              );
              setSortBy(column);
              setPage(1);
            }}
            onPageChange={setPage}
          />
          {data.hasPendingPayment && (
            <p className="mt-3 text-sm text-warning">
              Une facture est déjà en attente pour ce cabinet.
            </p>
          )}
        </CardContent>
      </Card>
      {isInvoiceOpen && (
        <Modal
          title="Créer une facture"
          onClose={() => !isConfirming && setIsInvoiceOpen(false)}
        >
          <form className="space-y-4" onSubmit={createInvoice}>
            <RequiredFieldsNotice />
            <MoneyField
              id="invoice-amount"
              value={invoiceAmount}
              onChange={setInvoiceAmount}
            />
            <NotesField
              id="invoice-notes"
              value={invoiceNotes}
              onChange={setInvoiceNotes}
            />
            <ErrorBanner message={error} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isConfirming}
                onClick={() => setIsInvoiceOpen(false)}
              >
                <X aria-hidden="true" />
                Annuler
              </Button>
              <Button type="submit" disabled={isConfirming}>
                <Plus aria-hidden="true" />
                {isConfirming ? "Création…" : "Créer"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {selectedPayment && (
        <Modal
          title={`Encaisser ${formatMad(selectedPayment.amount)}`}
          onClose={() => !isConfirming && setSelectedPayment(null)}
        >
          <form className="space-y-4" onSubmit={submitMarkAsPaid}>
            <RequiredFieldsNotice />
            <div className="space-y-2">
              <RequiredLabel htmlFor="payment-method" required>
                Mode de paiement
              </RequiredLabel>
              <select
                id="payment-method"
                required
                value={paymentForm.method}
                onChange={(event) =>
                  setPaymentForm((current) => ({
                    ...current,
                    method: event.target.value,
                    reference: "",
                  }))
                }
                className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              >
                <option value="cash">Espèces</option>
                <option value="bank_transfer">Virement bancaire</option>
              </select>
            </div>
            {paymentForm.method === "bank_transfer" && (
              <div className="space-y-2">
                <RequiredLabel htmlFor="payment-reference" required>
                  Référence
                </RequiredLabel>
                <Input
                  id="payment-reference"
                  value={paymentForm.reference}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      reference: event.target.value,
                    }))
                  }
                  required
                  maxLength={255}
                  placeholder="Ex. VIR-2026-001"
                />
              </div>
            )}
            <NotesField
              id="payment-notes"
              value={paymentForm.notes}
              onChange={(value) =>
                setPaymentForm((current) => ({ ...current, notes: value }))
              }
            />
            <ErrorBanner message={error} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isConfirming}
                onClick={() => setSelectedPayment(null)}
              >
                <X aria-hidden="true" />
                Annuler
              </Button>
              <Button type="submit" disabled={isConfirming}>
                <BadgeCheck aria-hidden="true" />
                {isConfirming ? "Enregistrement…" : "Enregistrer le paiement"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {pendingAction?.type === "cancel-subscription" && (
        <ConfirmDialog
          title="Confirmer l’annulation de l’abonnement"
          description={`L’abonnement du cabinet « ${data.clinic.name} » sera annulé selon les règles de période de grâce.`}
          confirmLabel="Annuler l’abonnement"
          variant="destructive"
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
          isLoading={isConfirming}
        />
      )}
      {pendingAction?.type === "delete-payment" && (
        <ConfirmDialog
          title="Confirmer la suppression de la facture"
          description={`La facture de ${formatMad(pendingAction.payment.amount)} sera supprimée.`}
          confirmLabel="Supprimer la facture"
          variant="destructive"
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
          isLoading={isConfirming}
        />
      )}
    </section>
  );
}

function MoneyField({ id, value, onChange }) {
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id} required>
        Montant (MAD)
      </RequiredLabel>
      <Input
        id={id}
        type="number"
        min="0.01"
        max="99999999.99"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        placeholder="Ex. 250"
      />
    </div>
  );
}

function NotesField({ id, value, onChange }) {
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id}>Notes (facultatif)</RequiredLabel>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={5000}
        placeholder="Ajoutez une note facultative…"
        className="min-h-24 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
      />
    </div>
  );
}

function PaymentMethodBadge({ method }) {
  if (!method) return "—";
  const isCash = method === "cash";
  return (
    <Badge variant={isCash ? "info" : "secondary"}>
      {isCash ? "Espèces" : method === "bank_transfer" ? "Virement bancaire" : method}
    </Badge>
  );
}

function formatSubscriptionDuration(startValue, endValue) {
  if (!startValue || !endValue) return "—";
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return "—";
  }

  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    start.getUTCMonth();
  const startLastDay =
    start.getUTCDate() ===
    new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const endLastDay =
    end.getUTCDate() ===
    new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  if (end.getUTCDate() < start.getUTCDate() && !(startLastDay && endLastDay)) {
    months -= 1;
  }

  if (months <= 0) {
    const days = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
    return `${days} jour${days === 1 ? "" : "s"}`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const duration = [];
  if (years) duration.push(`${years} an${years === 1 ? "" : "s"}`);
  if (remainingMonths) duration.push(`${remainingMonths} mois`);
  return duration.join(" et ");
}
