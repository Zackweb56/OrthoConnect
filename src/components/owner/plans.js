"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import {
  ConfirmDialog,
  ErrorBanner,
  Modal,
  RequiredFieldsNotice,
  RequiredLabel,
  apiRequest,
  formatMad,
  notifyToast,
} from "./shared";

const emptyResult = { rows: [], total: 0, page: 1, pageSize: 10 };
const emptyPlan = {
  id: null,
  name: "",
  slug: "",
  price: "0",
  billingInterval: "monthly",
  trialDays: "0",
};

function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function OwnerPlans() {
  const [result, setResult] = useState(emptyResult);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [form, setForm] = useState(emptyPlan);
  const [slugEdited, setSlugEdited] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [updatingPlanIds, setUpdatingPlanIds] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const loadPlans = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      search,
      sortBy,
      sortDirection,
    });
    return apiRequest(`/api/owner/plans?${params}`);
  }, [page, search, sortBy, sortDirection]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadPlans()
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
  }, [loadPlans, refresh]);

  function openCreate() {
    setForm(emptyPlan);
    setSlugEdited(false);
    setError("");
    setIsOpen(true);
  }

  function openEdit(plan) {
    setForm({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price: String(plan.price),
      billingInterval: plan.billingInterval,
      trialDays: String(plan.trialDays),
    });
    setSlugEdited(false);
    setError("");
    setIsOpen(true);
  }

  async function submitPlan(event) {
    event.preventDefault();
    setError("");
    setIsConfirming(true);
    try {
      const input = {
        name: form.name,
        slug: form.slug,
        price: form.price,
        billingInterval: form.billingInterval,
        trialDays: Number(form.trialDays),
        ...(!form.id ? { isActive: true } : {}),
      };
      await apiRequest(
        form.id ? `/api/owner/plans/${form.id}` : "/api/owner/plans",
        {
          method: form.id ? "PATCH" : "POST",
          body: JSON.stringify(input),
        },
      );
      setIsOpen(false);
      setRefresh((value) => value + 1);
      notifyToast(form.id ? "Le plan a été modifié." : "Le plan a été créé.");
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
      await apiRequest(`/api/owner/plans/${pendingAction.plan.id}`, {
        method: "DELETE",
      });
      notifyToast("Le plan a été supprimé.");
      setPendingAction(null);
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsConfirming(false);
    }
  }

  async function togglePlanStatus(plan) {
    setUpdatingPlanIds((current) => new Set(current).add(plan.id));
    try {
      await apiRequest(`/api/owner/plans/${plan.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      notifyToast(
        plan.isActive ? "Le plan a été désactivé." : "Le plan a été activé.",
      );
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setUpdatingPlanIds((current) => {
        const next = new Set(current);
        next.delete(plan.id);
        return next;
      });
    }
  }

  const columns = [
    { key: "name", label: "Plan", sortable: true },
    { key: "slug", label: "Identifiant" },
    {
      key: "price",
      label: "Prix",
      sortable: true,
      render: (plan) => formatMad(plan.price),
    },
    {
      key: "billingInterval",
      label: "Intervalle",
      sortable: true,
      render: (plan) => (plan.billingInterval === "yearly" ? "Annuel" : "Mensuel"),
    },
    {
      key: "trialDays",
      label: "Essai (jours)",
      sortable: true,
      render: (plan) => (plan.trialDays === 0 ? "Aucun" : plan.trialDays),
    },
    {
      key: "isActive",
      label: "Statut",
      sortable: true,
      render: (plan) => {
        const isUpdating = updatingPlanIds.has(plan.id);
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={plan.isActive}
              aria-label={`${plan.isActive ? "Désactiver" : "Activer"} le plan ${plan.name}`}
              title={`${plan.isActive ? "Désactiver" : "Activer"} le plan ${plan.name}`}
              disabled={isUpdating}
              onClick={() => togglePlanStatus(plan)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 ${
                plan.isActive ? "bg-success" : "bg-surface-soft"
              }`}
            >
              <span
                className={`size-4 rounded-full bg-white shadow transition-transform ${
                  plan.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-muted">
              {isUpdating ? "Mise à jour…" : plan.isActive ? "Actif" : "Inactif"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (plan) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon-lg"
            variant="outline"
            aria-label={`Modifier le plan ${plan.name}`}
            title="Modifier"
            onClick={() => openEdit(plan)}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon-lg"
            variant="destructive"
            aria-label={`Supprimer le plan ${plan.name}`}
            title="Supprimer"
            onClick={() => setPendingAction({ type: "delete", plan })}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  function sort(column) {
    setSortDirection((direction) =>
      sortBy === column && direction === "asc" ? "desc" : "asc",
    );
    setSortBy(column);
    setPage(1);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">Plans</h2>
          <p className="text-sm text-muted">Offres et périodes d’abonnement.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus aria-hidden="true" />
          Créer un plan
        </Button>
      </div>
      <ErrorBanner message={error} />
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
        onSort={sort}
        onPageChange={setPage}
      />
      {isOpen && (
        <Modal
          title={form.id ? "Modifier le plan" : "Créer un plan"}
          onClose={() => setIsOpen(false)}
        >
          <form
            className="space-y-4"
            onSubmit={submitPlan}
            onChange={() => setError("")}
          >
            <RequiredFieldsNotice />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Nom"
                name="name"
                placeholder="Ex. Offre Essentielle"
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    ...(!slugEdited ? { slug: slugify(name) } : {}),
                  }));
                }}
              />
              <FormField
                label="Identifiant"
                name="slug"
                placeholder="ex-offre-essentielle"
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setForm((current) => ({ ...current, slug: event.target.value }));
                }}
              />
              <FormField
                label="Prix (MAD)"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex. 250"
                value={form.price}
                onChange={updateForm(setForm)}
              />
              <div className="space-y-2">
                <RequiredLabel htmlFor="plan-interval" required>
                  Intervalle
                </RequiredLabel>
                <select
                  id="plan-interval"
                  name="billingInterval"
                  required
                  value={form.billingInterval}
                  onChange={updateForm(setForm)}
                  className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>
              <FormField
                label="Durée d’essai (jours)"
                name="trialDays"
                type="number"
                min="0"
                step="1"
                placeholder="0 pour aucun essai"
                value={form.trialDays}
                onChange={updateForm(setForm)}
              />
            </div>
            <ErrorBanner message={error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                <X aria-hidden="true" />
                Annuler
              </Button>
              <Button type="submit" disabled={isConfirming}>
                <Check aria-hidden="true" />
                {isConfirming ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {pendingAction && (
        <ConfirmDialog
          title="Confirmer la suppression"
          description={`Le plan « ${pendingAction.plan.name} » sera supprimé définitivement.`}
          confirmLabel="Supprimer"
          variant="destructive"
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
          isLoading={isConfirming}
        />
      )}
    </section>
  );
}

function updateForm(setForm) {
  return (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };
}

function FormField({ label, name, onChange, ...props }) {
  const id = `plan-${name}`;
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id} required>
        {label}
      </RequiredLabel>
      <Input id={id} name={name} required onChange={onChange} {...props} />
    </div>
  );
}
