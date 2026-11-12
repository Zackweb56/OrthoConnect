import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ApiError, ownerRoute, readJson } from "@/lib/owner-api";

const statusSchema = z.object({ isActive: z.boolean() });

export const PATCH = ownerRoute(async (request, { params }) => {
  const { id } = await params;
  const input = await readJson(request, statusSchema);
  const clinic = await prisma.clinic.findFirst({ where: { id, deletedAt: null } });
  if (!clinic) throw new ApiError("Cabinet introuvable.", 404);

  const updated = await prisma.clinic.update({
    where: { id },
    data: { isActive: input.isActive },
    select: { id: true, isActive: true },
  });
  return Response.json(updated);
});
