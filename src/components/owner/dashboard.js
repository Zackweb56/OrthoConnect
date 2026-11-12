"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CreditCard, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LoadingState,
  StatusBadge,
  apiRequest,
  formatDate,
  formatDateTime,
  formatMad,
  notifyToast,
} from "./shared";

const initialDashboard = {
  totalClinics: 0,
  activeSubscriptions: 0,
  totalRevenue: "0.00",
  recentClinics: [],
};

export function OwnerDashboard() {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/owner/dashboard")
      .then(setDashboard)
      .catch((requestError) => {
        setError(requestError.message);
        notifyToast(requestError.message, "error");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const cards = [
    {
      title: "Total des cabinets",
      value: dashboard.totalClinics,
      icon: Building2,
    },
    {
      title: "Abonnements actifs",
      value: dashboard.activeSubscriptions,
      icon: CreditCard,
    },
    {
      title: "Revenus encaissés",
      value: formatMad(dashboard.totalRevenue),
      icon: Wallet,
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold sm:text-2xl">Tableau de bord</h2>
        <p className="text-sm text-muted">
          Vue d’ensemble de la plateforme.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {isLoading ? (
        <LoadingState label="Chargement du tableau de bord…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(({ title, value, icon: Icon }) => (
              <Card key={title}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{title}</CardTitle>
                  <Icon className="size-5 text-muted" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Cabinets récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-line">
                {dashboard.recentClinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <Link
                        href={`/owner/clinics/${clinic.slug}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {clinic.name}
                      </Link>
                      <p className="text-sm text-muted">
                        {clinic.city || "Ville non renseignée"} ·{" "}
                        {formatDateTime(clinic.createdAt)}
                      </p>
                    </div>
                    <StatusBadge
                      status={clinic.isActive ? "active" : "suspended"}
                    />
                  </div>
                ))}
                {!dashboard.recentClinics.length && (
                  <p className="py-4 text-sm text-muted">
                    Aucun cabinet créé.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
