import { auth } from "../../../../../../auth";
import { UsersRolesManagement } from "@/components/cabinet/users-roles";
import { prisma } from "@/lib/db/prisma";
import { getSessionPermissions } from "@/lib/permissions";
import { forbidden, redirect } from "next/navigation";

export const instant = false;

export default async function ClinicUsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const grants = await getSessionPermissions(session, prisma);
  if (!grants.includes("users.view")) forbidden();

  const canCreateUsers = grants.includes("users.create");
  const canUpdateUsers = grants.includes("users.update");
  const canDeleteUsers = grants.includes("users.delete");
  const canViewRoles = grants.includes("roles.view");
  const canManageRoles = grants.includes("roles.manage");

  return (
    <UsersRolesManagement
      currentUserId={session.user.id}
      permissions={{
        canCreateUsers,
        canUpdateUsers,
        canDeleteUsers,
        canViewRoles,
        canManageRoles,
      }}
    />
  );
}
