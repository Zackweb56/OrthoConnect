"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Check, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import {
  ErrorBanner,
  ConfirmDialog,
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

const emptyResult = { rows: [], total: 0, page: 1, pageSize: 10 };

export function OwnerPayments() {
  const [result, setResult] = useState(emptyResult);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [eligibleClinics, setEligibleClinics] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [invoice, setInvoice] = useState({ clinicId: "", amount: "", notes: "" });
  const [form, setForm] = useState({
    method: "cash",
    reference: "",
    notes: "",
  });
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const loadPayments = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      search,
      status,
      sortBy,
      sortDirection,
    });
    return apiRequest(`/api/owner/payments?${params}`);
  }, [page, search, sortBy, sortDirection, status]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadPayments()
      .then((data) => {
        if (!cancelled) setResult(data);
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
  }, [loadPayments, refresh]);

  async function openCreateInvoice() {
    setError("");
    setInvoice({ clinicId: "", amount: "", notes: "" });
    setIsCreateOpen(true);
    setIsLoadingClinics(true);
    try {
      const { clinics } = await apiRequest("/api/owner/payments/eligible-clinics");
      setEligibleClinics(clinics);
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsLoadingClinics(false);
    }
  }

  async function createInvoice(event) {
    event.preventDefault();
    setError("");
    setIsConfirming(true);
    try {
      await apiRequest("/api/owner/payments", {
        method: "POST",
        body: JSON.stringify({ ...invoice, amount: Number(invoice.amount) }),
      });
      setIsCreateOpen(false);
      setRefresh((value) => value + 1);
      notifyToast("La facture a été créée.");
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
        `/api/owner/payments/${selectedPayment.id}/mark-paid`,
        { method: "POST", body: JSON.stringify(form) },
      );
      setSelectedPayment(null);
      setRefresh((value) => value + 1);
      notifyToast("Le paiement a été enregistré.");
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
      await apiRequest(`/api/owner/payments/${pendingAction.payment.id}`, {
        method: "DELETE",
      });
      notifyToast("La facture a été supprimée.");
      setPendingAction(null);
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsConfirming(false);
    }
  }

  const columns = [
    {
      key: "clinic",
      label: "Cabinet",
      sortable: true,
      render: (payment) => payment.clinic.name,
    },
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
    {
      key: "status",
      label: "Statut",
      render: (payment) => <StatusBadge status={payment.status} />,
    },
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
                aria-label={`Marquer la facture de ${payment.clinic.name} comme payée`}
                title="Marquer comme payé"
                onClick={() => {
                  setForm({ method: "cash", reference: "", notes: "" });
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
              aria-label={`Supprimer la facture de ${payment.clinic.name}`}
              title="Supprimer la facture"
              onClick={() => setPendingAction({ type: "delete", payment })}
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">Paiements</h2>
          <p className="text-sm text-muted">Factures et paiements des cabinets.</p>
        </div>
        <Button type="button" onClick={openCreateInvoice}>
          <Plus aria-hidden="true" />
          Créer une facture
        </Button>
      </div>
      <ErrorBanner message={error} />
      <div className="max-w-xs space-y-2">
        <Label htmlFor="payment-status">Statut</Label>
        <select
          id="payment-status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
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
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
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
      {isCreateOpen && (
        <Modal title="Créer une facture" onClose={() => setIsCreateOpen(false)}>
          <form className="space-y-4" onSubmit={createInvoice}>
            {isLoadingClinics ? (
              <LoadingState label="Chargement des cabinets…" />
            ) : (
              <>
            <RequiredFieldsNotice />
            <div className="space-y-2">
              <RequiredLabel htmlFor="invoice-clinic" required>
                Cabinet
              </RequiredLabel>
              <select
                id="invoice-clinic"
                required
                value={invoice.clinicId}
                onChange={(event) => {
                  const selected = eligibleClinics.find(
                    (clinic) => clinic.id === event.target.value,
                  );
                  setInvoice((current) => ({
                    ...current,
                    clinicId: event.target.value,
                    amount: String(selected?.subscription.plan.price ?? ""),
                  }));
                }}
                className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              >
                <option value="">Sélectionner un cabinet</option>
                {eligibleClinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>
            <FormInput
              label="Montant (MAD)"
              name="amount"
              required
              type="number"
              min="0.01"
              max="99999999.99"
              step="0.01"
              value={invoice.amount}
              placeholder="Ex. 250"
              onChange={updateField(setInvoice)}
            />
            <FormNotes
              value={invoice.notes}
              onChange={(value) =>
                setInvoice((current) => ({ ...current, notes: value }))
              }
            />
            <ErrorBanner message={error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                <X aria-hidden="true" />
                Annuler
              </Button>
              <Button type="submit" disabled={isConfirming}>
                <Check aria-hidden="true" />
                {isConfirming ? "Création…" : "Créer"}
              </Button>
            </div>
              </>
            )}
          </form>
        </Modal>
      )}
      {selectedPayment && (
        <Modal
          title={`Encaisser ${formatMad(selectedPayment.amount)}`}
          onClose={() => setSelectedPayment(null)}
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
                value={form.method}
                onChange={(event) =>
                  setForm((current) => ({ ...current, method: event.target.value }))
                }
                className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              >
                <option value="cash">Espèces</option>
                <option value="bank_transfer">Virement bancaire</option>
              </select>
            </div>
            {form.method === "bank_transfer" && (
              <FormInput
                label="Référence"
                name="reference"
                required
                value={form.reference}
                placeholder="Ex. VIR-2026-001"
                onChange={updateField(setForm)}
              />
            )}
            <FormNotes
              value={form.notes}
              onChange={(value) =>
                setForm((current) => ({ ...current, notes: value }))
              }
            />
            <ErrorBanner message={error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSelectedPayment(null)}>
                <X aria-hidden="true" />
                Annuler
              </Button>
              <Button type="submit" disabled={isConfirming}>
                <Check aria-hidden="true" />
                {isConfirming ? "Enregistrement…" : "Enregistrer le paiement"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {pendingAction && (
        <ConfirmDialog
          title="Confirmer la suppression de la facture"
          description={`La facture de ${formatMad(pendingAction.payment.amount)} pour « ${pendingAction.payment.clinic.name} » sera supprimée.`}
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

function updateField(setValue) {
  return (event) => {
    const { name, value } = event.target;
    setValue((current) => ({ ...current, [name]: value }));
  };
}

function FormInput({ label, name, onChange, required = false, ...props }) {
  const id = `payment-${name}`;
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id} required={required}>
        {label}
      </RequiredLabel>
      <Input id={id} name={name} required={required} onChange={onChange} {...props} />
    </div>
  );
}

function FormNotes({ value, onChange }) {
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor="payment-notes">Notes</RequiredLabel>
      <textarea
        id="payment-notes"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={5000}
        placeholder="Ajoutez une note facultative…"
        className="min-h-24 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
      />
    </div>
  );
}
