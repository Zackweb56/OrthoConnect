import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { cabinetRoute } from "@/lib/cabinet-api";
import { ApiError, lockClinic, readJson } from "@/lib/owner-api";

const reservedRoleNames = ["clinic_admin", "responsable", "therapist", "secretary"];

const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, "Utilisez des minuscules, chiffres et _"),
  permissionIds: z.array(z.string().min(1)).max(100),
}).refine((value) => !reservedRoleNames.includes(value.name), {
  message: "Ce nom est réservé à un rôle système.",
  path: ["name"],
});

export const GET = cabinetRoute(
  "roles.view",
  async (_request, _context, { clinicId }) => {
    const [roles, permissions, membershipCounts] = await Promise.all([
      prisma.role.findMany({
        where: {
          OR: [{ clinicId: null, isSystem: true }, { clinicId, isSystem: false }],
          name: { not: "responsable" },
        },
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        include: {
          rolePermissions: {
            select: { permissionId: true, permission: { select: { name: true } } },
          },
        },
      }),
      prisma.permission.findMany({
        orderBy: [{ group: "asc" }, { name: "asc" }],
        select: { id: true, name: true, group: true },
      }),
      prisma.clinicUser.groupBy({
        by: ["role"],
        where: { clinicId },
        _count: { userId: true },
      }),
    ]);
    const usersByRole = new Map(
      membershipCounts.map(({ role, _count }) => [role, _count.userId]),
    );

    return Response.json({
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        isSystem: role.isSystem,
        permissions: role.rolePermissions.map(({ permission }) => permission.name),
        permissionIds: role.rolePermissions.map(({ permissionId }) => permissionId),
        userCount: usersByRole.get(role.name) ?? 0,
      })),
      permissions,
    });
  },
);

export const POST = cabinetRoute(
  "roles.manage",
  async (request, _context, { clinicId }) => {
    const input = await readJson(request, createRoleSchema);
    const permissionIds = [...new Set(input.permissionIds)];

    const role = await prisma.$transaction(async (tx) => {
      await lockClinic(tx, clinicId);
      const conflictingRole = await tx.role.findFirst({
        where: {
          name: input.name,
          OR: [{ clinicId }, { clinicId: null, isSystem: true }],
        },
        select: { id: true },
      });
      if (conflictingRole) {
        throw new ApiError("Un rôle portant ce nom existe déjà.", 409);
      }

      const permissionCount = await tx.permission.count({
        where: { id: { in: permissionIds } },
      });
      if (permissionCount !== permissionIds.length) {
        throw new ApiError("La liste des permissions est invalide.", 422);
      }

      return tx.role.create({
        data: {
          name: input.name,
          clinicId,
          isSystem: false,
          rolePermissions: {
            create: permissionIds.map((permissionId) => ({ permissionId })),
          },
        },
        select: { id: true, name: true, isSystem: true },
      });
    });
    return Response.json({ role }, { status: 201 });
  },
);
