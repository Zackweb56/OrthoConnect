import { auth } from "../../auth";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/owner-api";
import { hasPermission } from "@/lib/permissions";
import { formatZodError } from "@/lib/validation";

export function cabinetRoute(permissionName, handler) {
  return createCabinetRoute(permissionName, handler);
}

export function cabinetAccountRoute(handler) {
  return createCabinetRoute(null, handler);
}

function createCabinetRoute(permissionName, handler) {
  return auth(async (request, context) => {
    try {
      const session = request.auth;
      const userId = session?.user?.id;
      const clinicId = session?.user?.clinicId;
      if (!userId) {
        throw new ApiError("Authentification requise.", 401);
      }
      if (!clinicId) {
        throw new ApiError("Aucun cabinet actif n’est associé à ce compte.", 403);
      }

      const membership = await prisma.clinicUser.findFirst({
        where: {
          userId,
          clinicId,
          isActive: true,
          clinic: { is: { deletedAt: null } },
        },
        select: { role: true },
      });
      if (!membership) {
        throw new ApiError("L’accès à ce cabinet n’est pas autorisé.", 403);
      }
      if (permissionName && !(await hasPermission(session, permissionName, prisma))) {
        throw new ApiError("Vous n’avez pas la permission requise.", 403);
      }

      return await handler(request, context, { session, clinicId, membership });
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json(
          { error: error.message, details: error.details },
          { status: error.status },
        );
      }
      if (error?.name === "ZodError") {
        return Response.json(
          {
            error: "Les informations saisies sont invalides.",
            details: formatZodError(error),
          },
          { status: 422 },
        );
      }
      if (error?.code === "P2002") {
        return Response.json(
          { error: "Un enregistrement avec ces valeurs existe déjà." },
          { status: 409 },
        );
      }
      if (error?.code === "P2002") {
        return Response.json(
          { error: "Un enregistrement avec ces valeurs existe déjà." },
          { status: 409 },
        );
      }
      if (error?.code === "P2003") {
        return Response.json(
          { error: "Cet enregistrement est encore utilisé." },
          { status: 409 },
        );
      }
      console.error("Cabinet API request failed:", error);
      return Response.json(
        { error: "Une erreur inattendue est survenue." },
        { status: 500 },
      );
    }
  });
}
