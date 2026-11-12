import Image from "next/image";
import Link from "next/link";
import { auth } from "../../../../../../auth";
import {
  ArrowLeft,
  CheckCircle2,
  CircleX,
  Clock3,
  CreditCard,
  LockKeyhole,
  Mail,
  MessageCircle,
  TriangleAlert,
} from "lucide-react";

import { SignOutButton } from "@/components/cabinet/sign-out-button";
import { Button } from "@/components/ui/button";
import { getClinicAccessContext } from "@/features/subscriptions/access";
import { forbidden, redirect } from "next/navigation";

export const instant = false;

/*
 * Each state maps to a single semantic accent derived from global.css tokens.
 * - "positive" → --success   (active / trial)
 * - "warning"  → --warning   (expired trial / past due)
 * - "danger"   → --danger    (cancelled / suspended)
 * - "neutral"  → --muted     (no subscription)
 *
 * The `tone` object provides class fragments so we never hardcode zinc/green/etc.
 * All classes reference the CSS variables exposed via @theme inline.
 */

const tones = {
  positive: {
    ring: "ring-success/25",
    bar: "bg-success",
    iconWrap: "bg-success/10 text-success ring-success/20",
    title: "text-success",
    subtle: "bg-success/5 text-success",
  },
  warning: {
    ring: "ring-warning/25",
    bar: "bg-warning",
    iconWrap: "bg-warning/10 text-warning ring-warning/20",
    title: "text-warning",
    subtle: "bg-warning/5 text-warning",
  },
  danger: {
    ring: "ring-danger/25",
    bar: "bg-danger",
    iconWrap: "bg-danger/10 text-danger ring-danger/20",
    title: "text-danger",
    subtle: "bg-danger/5 text-danger",
  },
  neutral: {
    ring: "ring-line/40",
    bar: "bg-muted",
    iconWrap: "bg-surface-soft text-muted ring-line/30",
    title: "text-fg",
    subtle: "bg-surface-soft text-muted",
  },
};

const accessStates = {
  active_valid: {
    tone: "positive",
    icon: CheckCircle2,
    title: "Accès actif",
    description:
      "L’abonnement de votre cabinet est actif. Vous pouvez continuer à utiliser votre espace.",
    isActive: true,
  },
  trial_valid: {
    tone: "positive",
    icon: Clock3,
    title: "Période d’essai active",
    description:
      "Votre période d’essai est en cours. Vous pouvez continuer à utiliser votre espace.",
    isActive: true,
  },
  expired_trial: {
    tone: "warning",
    icon: LockKeyhole,
    title: "Essai expiré",
    description:
      "Votre période d’essai est terminée. Contactez le support pour réactiver l’accès de votre cabinet.",
    isActive: false,
  },
  past_due: {
    tone: "warning",
    icon: Clock3,
    title: "Abonnement en retard",
    description:
      "La période de votre abonnement est terminée. Les services du cabinet sont temporairement suspendus jusqu’à la régularisation du paiement.",
    isActive: false,
  },
  cancelled: {
    tone: "danger",
    icon: CircleX,
    title: "Abonnement annulé",
    description:
      "L’abonnement de votre cabinet a été annulé. Contactez le support pour obtenir de l’aide.",
    isActive: false,
  },
  suspended_by_owner: {
    tone: "danger",
    icon: TriangleAlert,
    title: "Cabinet suspendu",
    description:
      "L’accès à votre cabinet a été suspendu par l’administration. Contactez le support pour en connaître la raison.",
    isActive: false,
  },
  no_subscription: {
    tone: "neutral",
    icon: CreditCard,
    title: "Aucun abonnement actif",
    description:
      "Aucun plan n’a encore été attribué à votre cabinet. Contactez l’administration pour activer un abonnement.",
    isActive: false,
  },
};

const fallbackState = {
  tone: "danger",
  icon: LockKeyhole,
  title: "Abonnement inactif",
  description:
    "L’accès au cabinet est restreint. Contactez le support pour obtenir de l’aide.",
  isActive: false,
};

export default async function BillingSuspendedPage({ params, searchParams }) {
  const { clinicSlug } = await params;
  const query = await searchParams;
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.isPlatformOwner) redirect("/owner/dashboard");

  const context = await getClinicAccessContext(session.user.id, clinicSlug);
  if (!context) forbidden();

  if (
    context.isAllowed &&
    !["active_valid", "trial_valid"].includes(context.reason)
  ) {
    redirect(`/${encodeURIComponent(clinicSlug)}/dashboard`);
  }

  const state = accessStates[context.reason] ?? fallbackState;
  const tone = tones[state.tone];
  const Icon = state.icon;

  const errorMessage =
    query?.error === "clinic_suspended"
      ? "Votre cabinet a été suspendu. Veuillez contacter le support."
      : query?.error === "subscription_inactive"
        ? "L’abonnement de votre cabinet est inactif. Veuillez contacter le support."
        : "";

  const supportMessage = encodeURIComponent(
    `Bonjour, j’ai besoin d’aide pour réactiver l’accès de mon cabinet « ${context.clinic.name} ».`
  );
  const emailSubject = encodeURIComponent(
    `Réactivation de l’abonnement — ${context.clinic.name}`
  );
  const emailBody = encodeURIComponent(
    `Bonjour,\n\nJe souhaite obtenir de l’aide pour réactiver l’accès de mon cabinet « ${context.clinic.name} ».\n\nMerci.`
  );

  return (
    <main className="min-h-screen bg-canvas text-fg">
      {/* ============ HEADER ============ */}
      <header className="border-b border-line/40">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <Link
            href="/"
            aria-label="Accueil OrthoConnect"
            className="shrink-0"
          >
            <Image
              src="/assets/images/brand_logo.png"
              alt="OrthoConnect"
              width={160}
              height={32}
              className="h-20 w-auto sm:h-25"
              priority
            />
          </Link>

          <div className="min-w-0 text-end">
            <p className="truncate text-sm font-semibold text-fg">
              {context.clinic.name}
            </p>
            <p className="truncate text-xs text-muted">
              {session.user.name || session.user.email}
            </p>
          </div>
        </div>
      </header>

      {/* ============ CARD ============ */}
      <section className="mx-auto flex w-full max-w-lg flex-col px-4 pt-8 pb-12 sm:max-w-xl sm:pt-14 sm:pb-16">
        <div
          className={`overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ${tone.ring} transition-colors`}
        >
          {/* Top accent bar — single source of state color */}
          <div className={`h-1 w-full ${tone.bar}`} aria-hidden="true" />

          <div className="flex flex-col items-center px-5 pt-8 pb-6 text-center sm:px-8 sm:pt-10 sm:pb-8">
            {/* Icon */}
            <div
              className={`grid size-14 place-items-center rounded-full ring-1 sm:size-16 ${tone.iconWrap}`}
              aria-hidden="true"
            >
              <Icon className="size-7 sm:size-8" />
            </div>

            {/* Title */}
            <h1
              className={`mt-5 text-lg font-semibold tracking-tight sm:text-xl ${tone.title}`}
            >
              {state.title}
            </h1>

            {/* Description */}
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted sm:text-[15px]">
              {state.description}
            </p>

            {/* Optional query error — subtle inline alert (avoid duplication of main message) */}
            {errorMessage && (
              <p
                role="alert"
                className={`mt-5 w-full rounded-xl px-3 py-2.5 text-start text-xs leading-relaxed sm:text-sm ${tone.subtle} ring-1 ring-inset ring-current/10`}
              >
                <TriangleAlert
                  className="me-1.5 inline size-3.5 -translate-y-px"
                  aria-hidden="true"
                />
                {errorMessage}
              </p>
            )}

            {/* Actions */}
            {state.isActive ? (
              <Button
                asChild
                size="lg"
                className="mt-6 w-full sm:w-auto"
                title="Retourner au tableau de bord"
              >
                <Link
                  href={`/${encodeURIComponent(clinicSlug)}/dashboard`}
                >
                  <ArrowLeft aria-hidden="true" />
                  Retour au tableau de bord
                </Link>
              </Button>
            ) : (
              <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-2">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-[#25D366] text-white hover:bg-[#20ba59] focus-visible:ring-[#25D366]/40"
                  title="Contacter le support via WhatsApp"
                >
                  <a
                    href={`https://wa.me/?text=${supportMessage}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle aria-hidden="true" />
                    Support WhatsApp
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full"
                  title="Envoyer un e-mail au support"
                >
                  <a
                    href={`mailto:support@orthoconnect.app?subject=${emailSubject}&body=${emailBody}`}
                  >
                    <Mail aria-hidden="true" />
                    Envoyer un e-mail
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Footer — only for inactive states */}
          {!state.isActive && (
            <div className="border-t border-line/40 bg-surface-soft/50 px-5 py-3 text-center sm:px-8">
              <SignOutButton
                variant="ghost"
                className="text-xs text-muted hover:text-fg sm:text-sm"
              >
                Se déconnecter
              </SignOutButton>
            </div>
          )}
        </div>

        {/* Small helper below card */}
        <p className="mt-6 text-center text-xs text-muted">
          Besoin d’aide ?{" "}
          <a
            href={`mailto:support@orthoconnect.app?subject=${emailSubject}`}
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            support@orthoconnect.app
          </a>
        </p>
      </section>
    </main>
  );
}