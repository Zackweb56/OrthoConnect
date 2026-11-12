import { prisma } from "@/lib/db/prisma";
import {
  ApiError,
  lockClinic,
  lockPayment,
  ownerRoute,
} from "@/lib/owner-api";

export const DELETE = ownerRoute(async (_request, { params }) => {
  const { id: clinicId, paymentId } = await params;
  await prisma.$transaction(async (tx) => {
    const initial = await tx.payment.findFirst({
      where: { id: paymentId, clinicId },
      select: { id: true },
    });
    if (!initial) throw new ApiError("Paiement introuvable.", 404);
    await lockClinic(tx, clinicId);
    await lockPayment(tx, paymentId);
    const payment = await tx.payment.findFirst({
      where: { id: paymentId, clinicId },
    });
    if (!payment) throw new ApiError("Paiement introuvable.", 404);
    if (!["pending", "failed"].includes(payment.status)) {
      throw new ApiError(
        "Seuls les paiements en attente ou échoués peuvent être supprimés.",
        422,
      );
    }
    await tx.payment.delete({ where: { id: paymentId } });
  });
  return Response.json({ success: true });
});
