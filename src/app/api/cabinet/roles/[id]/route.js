import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { cabinetRoute } from "@/lib/cabinet-api";
import { ApiError, lockClinic, readJson } from "@/lib/owner-api";

const reservedRoleNames = ["clinic_admin", "responsable", "therapist", "secretary"];

const roleUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(64)
      .regex(/^[a-z][a-z0-9_]*$/, "Utilisez des minuscules, chiffres et _")
      .optional(),
    permissionIds: z.array(z.string().min(1)).max(100).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Modifiez au moins un champ.",
  })
  .refine((value) => !value.name || !reservedRoleNames.includes(value.name), {
    message: "Ce nom est réservé à un rôle système.",
    path: ["name"],
  });

export const PATCH = cabinetRoute(
  "roles.manage",
  async (request, { params }, { clinicId }) => {
    const { id } = await params;
    const input = await readJson(request, roleUpdateSchema);
    const permissionIds =
      input.permissionIds === undefined
        ? undefined
        : [...new Set(input.permissionIds)];

    const role = await prisma.$transaction(async (tx) => {
      await lockClinic(tx, clinicId);
      const existing = await tx.role.findUnique({ where: { id } });
      if (!existing || existing.clinicId !== clinicId) {
        throw new ApiError("Rôle introuvable.", 404);
      }
      if (existing.isSystem) {
        throw new ApiError("Les rôles système ne peuvent pas être modifiés.", 422);
      }

      if (input.name && input.name !== existing.name) {
        const conflictingRole = await tx.role.findFirst({
          where: {
            name: input.name,
            OR: [{ clinicId }, { clinicId: null, isSystem: true }],
            id: { not: id },
          },
          select: { id: true },
        });
        if (conflictingRole) {
          throw new ApiError("Un rôle portant ce nom existe déjà.", 409);
        }
      }

      if (permissionIds !== undefined) {
        const permissionCount = await tx.permission.count({
          where: { id: { in: permissionIds } },
        });
        if (permissionCount !== permissionIds.length) {
          throw new ApiError("La liste des permissions est invalide.", 422);
        }
      }

      const updated = await tx.role.update({
        where: { id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(permissionIds !== undefined
            ? {
                rolePermissions: {
                  deleteMany: {},
                  create: permissionIds.map((permissionId) => ({
                    permissionId,
                  })),
                },
              }
            : {}),
        },
        select: { id: true, name: true, isSystem: true },
      });

      if (input.name && input.name !== existing.name) {
        await tx.clinicUser.updateMany({
          where: { clinicId, role: existing.name },
          data: { role: input.name },
        });
      }
      return updated;
    });
    return Response.json({ role });
  },
);

export const DELETE = cabinetRoute(
  "roles.manage",
  async (_request, { params }, { clinicId }) => {
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      await lockClinic(tx, clinicId);
      const role = await tx.role.findUnique({ where: { id } });
      if (!role || role.clinicId !== clinicId) {
        throw new ApiError("Rôle introuvable.", 404);
      }
      if (role.isSystem) {
        throw new ApiError("Les rôles système ne peuvent pas être supprimés.", 422);
      }

      const userCount = await tx.clinicUser.count({
        where: { clinicId, role: role.name },
      });
      if (userCount > 0) {
        throw new ApiError(
          "Ce rôle ne peut pas être supprimé tant que des utilisateurs y sont affectés.",
          422,
        );
      }
      await tx.role.delete({ where: { id } });
    });
    return Response.json({ success: true });
  },
);
