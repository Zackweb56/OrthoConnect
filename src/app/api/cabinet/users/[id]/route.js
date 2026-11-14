import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { cabinetRoute } from "@/lib/cabinet-api";
import { ApiError, lockClinic, readJson } from "@/lib/owner-api";
import { findClinicRoleByName } from "@/lib/permissions";

const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    role: z.string().trim().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Modifiez au moins un champ.",
  });

export const PATCH = cabinetRoute(
  "users.update",
  async (request, { params }, { clinicId, session }) => {
    const { id: userId } = await params;
    const input = await readJson(request, updateUserSchema);

    const updatedUser = await prisma.$transaction(async (tx) => {
      await lockClinic(tx, clinicId);
      const membership = await tx.clinicUser.findUnique({
        where: { clinicId_userId: { clinicId, userId } },
      });
      if (!membership) throw new ApiError("Utilisateur introuvable.", 404);

      if (
        membership.role === "clinic_admin" &&
        ((input.role !== undefined && input.role !== "clinic_admin") ||
          input.isActive === false)
      ) {
        throw new ApiError(
          "L’administrateur principal ne peut pas être rétrogradé ou désactivé.",
          422,
        );
      }
      if (userId === session.user.id && input.isActive === false) {
        throw new ApiError("Vous ne pouvez pas désactiver votre propre compte.", 422);
      }

      if (input.role) {
        if (input.role === "responsable") {
          throw new ApiError("Sélectionnez un rôle de membre du cabinet.", 422);
        }
        const role = await findClinicRoleByName(clinicId, input.role, tx);
        if (!role) throw new ApiError("Sélectionnez un rôle valide.", 422);
        if (role.name === "clinic_admin" && input.isActive === false) {
          throw new ApiError(
            "Un administrateur du cabinet ne peut pas être créé désactivé.",
            422,
          );
        }

        if (
          role.name === "clinic_admin" &&
          membership.role !== "clinic_admin" &&
          (await tx.clinicUser.findFirst({
            where: {
              clinicId,
              role: "clinic_admin",
              isActive: true,
              userId: { not: userId },
            },
            select: { userId: true },
          }))
        ) {
          throw new ApiError("Ce cabinet possède déjà un administrateur actif.", 409);
        }
        await tx.clinicUser.update({
          where: { clinicId_userId: { clinicId, userId } },
          data: { role: role.name },
        });
      }

      if (input.isActive !== undefined) {
        await tx.clinicUser.update({
          where: { clinicId_userId: { clinicId, userId } },
          data: { isActive: input.isActive },
        });
      }

      const user = input.name
        ? await tx.user.update({
            where: { id: userId },
            data: { name: input.name },
            select: { id: true, name: true, email: true },
          })
        : await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
          });
      const savedMembership = await tx.clinicUser.findUnique({
        where: { clinicId_userId: { clinicId, userId } },
        select: { role: true, isActive: true },
      });
      return { ...user, ...savedMembership };
    });

    return Response.json({ user: updatedUser });
  },
);

export const DELETE = cabinetRoute(
  "users.delete",
  async (_request, { params }, { clinicId, session }) => {
    const { id: userId } = await params;
    await prisma.$transaction(async (tx) => {
      await lockClinic(tx, clinicId);
      const membership = await tx.clinicUser.findUnique({
        where: { clinicId_userId: { clinicId, userId } },
        select: { role: true },
      });
      if (!membership) throw new ApiError("Utilisateur introuvable.", 404);
      if (membership.role === "clinic_admin") {
        throw new ApiError("L’administrateur principal ne peut pas être supprimé.", 422);
      }
      if (userId === session.user.id) {
        throw new ApiError("Vous ne pouvez pas supprimer votre propre accès.", 422);
      }
      await tx.clinicUser.delete({
        where: { clinicId_userId: { clinicId, userId } },
      });
    });
    return Response.json({ success: true });
  },
);
