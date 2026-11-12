"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CircleCheck,
  ExternalLink,
  PauseCircle,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import {
  ConfirmDialog,
  ErrorBanner,
  Modal,
  PasswordInput,
  RequiredFieldsNotice,
  RequiredLabel,
  StatusBadge,
  apiRequest,
  formatDateTime,
  notifyToast,
} from "./shared";

const emptyResult = { rows: [], total: 0, page: 1, pageSize: 10 };
const emptyClinic = { name: "", phone: "", city: "" };
const emptyAdmin = { name: "", email: "", password: "" };

export function OwnerClinics() {
  const [result, setResult] = useState(emptyResult);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isClinicOpen, setIsClinicOpen] = useState(false);
  const [adminClinic, setAdminClinic] = useState(null);
  const [clinicForm, setClinicForm] = useState(emptyClinic);
  const [adminForm, setAdminForm] = useState(emptyAdmin);
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const loadClinics = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      search,
      sortBy,
      sortDirection,
    });
    return apiRequest(`/api/owner/clinics?${params}`);
  }, [page, search, sortBy, sortDirection]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadClinics()
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
  }, [loadClinics, refresh]);

  async function submitClinic(event) {
    event.preventDefault();
    setFormError("");
    setIsConfirming(true);
    try {
      await apiRequest("/api/owner/clinics", {
        method: "POST",
        body: JSON.stringify(clinicForm),
      });
      setIsClinicOpen(false);
      setClinicForm(emptyClinic);
      setRefresh((value) => value + 1);
      notifyToast("Le cabinet a été créé.");
    } catch (requestError) {
      setFormError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsConfirming(false);
    }
  }

  async function submitAdmin(event) {
    event.preventDefault();
    setFormError("");
    setIsConfirming(true);
    try {
      await apiRequest(`/api/owner/clinics/${adminClinic.id}/admin`, {
        method: "POST",
        body: JSON.stringify(adminForm),
      });
      setAdminClinic(null);
      setAdminForm(emptyAdmin);
      setRefresh((value) => value + 1);
      notifyToast("Le compte administrateur a été créé.");
    } catch (requestError) {
      setFormError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsConfirming(false);
    }
  }

  async function confirmAction() {
    if (!pendingAction) return;
    await updateClinicStatus(pendingAction.clinic);
  }

  async function updateClinicStatus(clinic) {
    setIsConfirming(true);
    setFormError("");
    try {
      await apiRequest(`/api/owner/clinics/${clinic.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !clinic.isActive }),
      });
      notifyToast(
        clinic.isActive
          ? "Le cabinet a été suspendu."
          : "Le cabinet a été réactivé.",
      );
      setPendingAction(null);
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setFormError(requestError.message);
      notifyToast(requestError.message, "error");
    } finally {
      setIsConfirming(false);
    }
  }

  const columns = [
    {
      key: "name",
      label: "Cabinet",
      sortable: true,
      render: (clinic) => (
        <Link
          href={`/owner/clinics/${clinic.slug}`}
          title={`Ouvrir les détails du cabinet ${clinic.name}`}
          className="font-medium text-primary hover:underline"
        >
          {clinic.name}
        </Link>
      ),
    },
    { key: "city", label: "Ville", sortable: true },
    { key: "phone", label: "Téléphone" },
    {
      key: "subscriptions",
      label: "Abonnement",
      render: (clinic) => {
        const subscription = clinic.subscriptions[0];
        if (!subscription) return "Aucun";
        const variant = {
          active: "success",
          trialing: "info",
          past_due: "danger",
          cancelled: "danger",
          canceled: "danger",
          expired: "warning",
        }[subscription.status] ?? "secondary";
        const statusLabel = {
          active: "Actif",
          trialing: "En essai",
          past_due: "En retard",
          cancelled: "Annulé",
          canceled: "Annulé",
          expired: "Expiré",
        }[subscription.status] ?? subscription.status;
        return (
          <Badge variant={variant}>
            {subscription.plan.name} - {statusLabel}
          </Badge>
        );
      },
    },
    {
      key: "isActive",
      label: "Statut",
      sortable: true,
      render: (clinic) => (
        <StatusBadge status={clinic.isActive ? "active" : "suspended"} />
      ),
    },
    {
      key: "createdAt",
      label: "Créé le",
      sortable: true,
      render: (clinic) => formatDateTime(clinic.createdAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (clinic) => (
        <div className="flex items-center gap-1">
          <Button
            asChild
            type="button"
            size="icon-lg"
            variant="outline"
            aria-label={`Ouvrir les détails du cabinet ${clinic.name}`}
            title={`Ouvrir les détails du cabinet ${clinic.name}`}
          >
            <Link href={`/owner/clinics/${clinic.slug}`}>
              <ExternalLink aria-hidden="true" />
            </Link>
          </Button>
          {!clinic.users?.length && (
            <Button
              type="button"
              size="icon-lg"
              variant="outline"
              aria-label={`Créer un administrateur pour ${clinic.name}`}
              title="Créer un administrateur"
              onClick={() => {
                setAdminClinic(clinic);
                setAdminForm(emptyAdmin);
                setFormError("");
              }}
            >
              <UserPlus aria-hidden="true" />
            </Button>
          )}
          <Button
            type="button"
            size="icon-lg"
            variant={clinic.isActive ? "destructive" : "secondary"}
            disabled={isConfirming}
            aria-label={
              clinic.isActive
                ? `Suspendre ${clinic.name}`
                : `Réactiver ${clinic.name}`
            }
            title={clinic.isActive ? "Suspendre le cabinet" : "Réactiver le cabinet"}
            onClick={() => {
              setFormError("");
              if (clinic.isActive) {
                setPendingAction({ type: "status", clinic });
              } else {
                updateClinicStatus(clinic);
              }
            }}
          >
            {clinic.isActive ? (
              <PauseCircle aria-hidden="true" />
            ) : (
              <CircleCheck aria-hidden="true" />
            )}
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
          <h2 className="text-xl font-semibold sm:text-2xl">Cabinets</h2>
          <p className="text-sm text-muted">Gestion des cabinets clients.</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setClinicForm(emptyClinic);
            setFormError("");
            setIsClinicOpen(true);
          }}
        >
          <Plus aria-hidden="true" />
          Créer un cabinet
        </Button>
      </div>
      <ErrorBanner message={error || formError} />
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
      {isClinicOpen && (
        <Modal
          title="Créer un cabinet"
          onClose={() => {
            setIsClinicOpen(false);
            setFormError("");
          }}
        >
          <form
            className="space-y-4"
            onSubmit={submitClinic}
            onChange={() => setFormError("")}
          >
            <RequiredFieldsNotice />
            <FormField
              label="Nom du cabinet"
              name="name"
              required
              placeholder="Ex. Cabinet Horizon"
              value={clinicForm.name}
              onChange={updateForm(setClinicForm)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Téléphone"
                name="phone"
                placeholder="Ex. +212 6 00 00 00 00"
                value={clinicForm.phone}
                onChange={updateForm(setClinicForm)}
              />
              <FormField
                label="Ville"
                name="city"
                placeholder="Ex. Casablanca"
                value={clinicForm.city}
                onChange={updateForm(setClinicForm)}
              />
            </div>
            <ErrorBanner message={formError} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsClinicOpen(false)}
              >
                <X aria-hidden="true" />
                Annuler
              </Button>
              <Button type="submit" disabled={isConfirming}>
                <Building2 aria-hidden="true" />
                {isConfirming ? "Création…" : "Créer le cabinet"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {adminClinic && (
        <Modal
          title={`Créer l’administrateur de ${adminClinic.name}`}
          onClose={() => {
            setAdminClinic(null);
            setFormError("");
          }}
        >
          <form
            className="space-y-4"
            onSubmit={submitAdmin}
            onChange={() => setFormError("")}
          >
            <RequiredFieldsNotice />
            <FormField
              label="Nom complet"
              name="name"
              required
              placeholder="Ex. Salma El Amrani"
              value={adminForm.name}
              onChange={updateForm(setAdminForm)}
            />
            <FormField
              label="Adresse e-mail"
              name="email"
              type="email"
              required
              placeholder="nom@cabinet.ma"
              value={adminForm.email}
              onChange={updateForm(setAdminForm)}
            />
            <div className="space-y-2">
              <RequiredLabel htmlFor="admin-password" required>
                Mot de passe
              </RequiredLabel>
              <PasswordInput
                id="admin-password"
                required
                minLength={12}
                autoComplete="new-password"
                placeholder="12 caractères minimum"
                value={adminForm.password}
                onChange={updateForm(setAdminForm, "password")}
                onGenerate={() =>
                  setAdminForm((current) => ({
                    ...current,
                    password: generateStrongPassword(),
                  }))
                }
              />
              <p className="text-xs text-muted">
                Au moins 12 caractères, avec majuscule, minuscule, chiffre et symbole.
              </p>
            </div>
            <ErrorBanner message={formError} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdminClinic(null)}
              >
                <X aria-hidden="true" />
                Annuler
              </Button>
              <Button type="submit" disabled={isConfirming}>
                <UserPlus aria-hidden="true" />
                {isConfirming ? "Création…" : "Créer le compte"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {pendingAction?.type === "status" && (
        <ConfirmDialog
          title="Confirmer la suspension"
          description={`Le cabinet « ${pendingAction.clinic.name} » sera suspendu.`}
          confirmLabel="Suspendre"
          variant="destructive"
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
          isLoading={isConfirming}
        />
      )}
    </section>
  );
}

function updateForm(setForm, fieldName) {
  return (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [fieldName || name]: value }));
  };
}

function FormField({ label, name, onChange, required = false, ...props }) {
  const id = `clinic-${name}`;
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id} required={required}>
        {label}
      </RequiredLabel>
      <Input id={id} name={name} onChange={onChange} {...props} />
    </div>
  );
}

function generateStrongPassword() {
  const groups = [
    "abcdefghijkmnopqrstuvwxyz",
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "23456789",
    "!@#$%^&*()-_=+[]{}",
  ];
  const allCharacters = groups.join("");
  const randomIndex = (length) => {
    const range = 0x100000000;
    const limit = Math.floor(range / length) * length;
    let value;
    do {
      value = globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
    } while (value >= limit);
    return value % length;
  };
  const characters = groups.map((group) => group[randomIndex(group.length)]);
  while (characters.length < 20) {
    characters.push(allCharacters[randomIndex(allCharacters.length)]);
  }
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }
  return characters.join("");
}
