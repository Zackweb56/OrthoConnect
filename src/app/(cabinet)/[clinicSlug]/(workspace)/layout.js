import { auth } from "../../../../../auth";
import { ProShell } from "@/components/layouts/pro-shell";
import { cabinetNav } from "@/config/navigation";
import {
  findFirstClinicSlugForUser,
  getClinicAccessContext,
} from "@/features/subscriptions/access";
import { prisma } from "@/lib/db/prisma";
import { getSessionPermissions } from "@/lib/permissions";
import { forbidden, redirect } from "next/navigation";

export const instant = false;

export default async function ClinicWorkspaceLayout({ children, params }) {
  const { clinicSlug } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.isPlatformOwner) redirect("/owner/dashboard");

  const context = await getClinicAccessContext(session.user.id, clinicSlug);
  if (!context) forbidden();

  if (session.user.clinicId !== context.clinic.id) {
    const firstClinicSlug = await findFirstClinicSlugForUser(session.user.id);
    if (!firstClinicSlug) forbidden();
    redirect(`/${encodeURIComponent(firstClinicSlug)}/dashboard`);
  }

  if (!context.clinic.isActive) {
    redirect(`/${encodeURIComponent(clinicSlug)}/billing/suspended?error=clinic_suspended`);
  }
  if (!context.isAllowed) {
    redirect(`/${encodeURIComponent(clinicSlug)}/billing/suspended?error=subscription_inactive`);
  }

  const permissions = await getSessionPermissions(session, prisma);
  const nav = cabinetNav.map((item) => ({
    ...item,
    href: `/${encodeURIComponent(clinicSlug)}${item.href}`,
  }));

  return (
    <ProShell
      nav={nav}
      title={context.clinic.name}
      user={session.user}
      permissions={permissions}
    >
      {children}
    </ProShell>
  );
}
