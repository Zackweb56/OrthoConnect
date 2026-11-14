async function findMembership(session, db) {
  const userId = session?.user?.id;
  const clinicId = session?.user?.clinicId;
  if (!userId || !clinicId) return null;

  return db.clinicUser.findFirst({
    where: {
      userId,
      clinicId,
      isActive: true,
      clinic: { is: { deletedAt: null } },
    },
    select: { role: true },
  });
}

export async function findClinicRoleByName(clinicId, roleName, db) {
  const clinicRole = await db.role.findFirst({
    where: {
      name: roleName,
      clinicId,
      isSystem: false,
    },
    select: { id: true, name: true },
  });
  if (clinicRole) return clinicRole;

  return db.role.findFirst({
    where: {
      name: roleName,
      clinicId: null,
      isSystem: true,
    },
    select: { id: true, name: true },
  });
}

export async function hasPermission(
  session,
  permissionName,
  db,
) {
  if (session?.user?.isPlatformOwner === true) return true;

  const clinicId = session?.user?.clinicId;
  const membership = await findMembership(session, db);
  if (!clinicId || !membership) return false;

  const role = await findClinicRoleByName(clinicId, membership.role, db);
  if (!role) return false;

  const assignment = await db.rolePermission.findFirst({
    where: {
      roleId: role.id,
      permission: { is: { name: permissionName } },
    },
    select: { roleId: true },
  });
  return Boolean(assignment);
}

export async function getSessionPermissions(session, db) {
  if (session?.user?.isPlatformOwner === true) {
    const permissions = await db.permission.findMany({ select: { name: true } });
    return permissions.map(({ name }) => name);
  }

  const clinicId = session?.user?.clinicId;
  const membership = await findMembership(session, db);
  if (!clinicId || !membership) return [];

  const role = await findClinicRoleByName(clinicId, membership.role, db);
  if (!role) return [];

  const assignments = await db.rolePermission.findMany({
    where: { roleId: role.id },
    select: { permission: { select: { name: true } } },
  });
  return assignments.map(({ permission }) => permission.name);
}
