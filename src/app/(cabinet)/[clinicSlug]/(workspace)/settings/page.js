import { auth } from "../../../../../../auth";
import Link from "next/link";
import { AccountSettings } from "@/components/cabinet/account-settings";
import { ClinicSettings } from "@/components/cabinet/clinic-settings";
import { prisma } from "@/lib/db/prisma";
import { getSessionPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const instant = false;

export default async function SettingsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const permissions = await getSessionPermissions(session, prisma);
  const canViewClinic = permissions.includes("clinic.view");
  const sections = [
    ...(canViewClinic ? [{ id: "clinic", label: "Profil du cabinet" }] : []),
    { id: "account", label: "Mon profil" },
  ];
  const requestedSection = (await searchParams)?.section;
  const activeSection = sections.some(({ id }) => id === requestedSection)
    ? requestedSection
    : sections[0].id;

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-xl font-semibold sm:text-2xl">Paramètres</h2>
        <p className="text-sm text-muted">
          Choisissez les paramètres que vous souhaitez consulter ou modifier.
        </p>
      </header>
      <div className="grid gap-5 md:grid-cols-[12rem_minmax(0,1fr)]">
        <nav
          aria-label="Sections des paramètres"
          className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible"
        >
          {sections.map(({ id, label }) => (
            <Link
              key={id}
              href={`?section=${id}`}
              aria-current={activeSection === id ? "page" : undefined}
              className={`shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === id
                  ? "bg-primary text-primary-fg"
                  : "bg-surface text-fg hover:bg-surface-soft"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">
          {activeSection === "clinic" ? (
            <ClinicSettings canUpdate={permissions.includes("clinic.update")} />
          ) : (
            <AccountSettings />
          )}
        </div>
      </div>
    </section>
  );
}
