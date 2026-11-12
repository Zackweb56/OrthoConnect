import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ApiError,
  lockClinic,
  lockPayment,
  ownerRoute,
} from "@/lib/owner-api";

const idSchema = z.string().min(1);

export const DELETE = ownerRoute(async (_request, { params }) => {
  const { id } = await params;
  idSchema.parse(id);
  await prisma.$transaction(async (tx) => {
    const initial = await tx.payment.findUnique({ where: { id } });
    if (!initial) throw new ApiError("Paiement introuvable.", 404);
    await lockClinic(tx, initial.clinicId);
    await lockPayment(tx, id);
    const payment = await tx.payment.findUnique({ where: { id } });
    if (!payment) throw new ApiError("Paiement introuvable.", 404);
    if (!["pending", "failed"].includes(payment.status)) {
      throw new ApiError("Seuls les paiements en attente ou échoués peuvent être supprimés.", 422);
    }
    await tx.payment.delete({ where: { id } });
  });
  return Response.json({ success: true });
});
