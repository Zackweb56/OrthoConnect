import { auth } from "../../../../auth";
import { findFirstClinicSlugForUser } from "@/features/subscriptions/access";
import { forbidden, redirect } from "next/navigation";

export const instant = false;

export default async function CabinetDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.isPlatformOwner) redirect("/owner/dashboard");

  const clinicSlug = await findFirstClinicSlugForUser(session.user.id);
  if (!clinicSlug) forbidden();

  redirect(`/${encodeURIComponent(clinicSlug)}/dashboard`);
}
