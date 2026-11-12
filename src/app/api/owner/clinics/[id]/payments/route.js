import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ApiError,
  lockClinic,
  ownerRoute,
  readJson,
} from "@/lib/owner-api";
import { calculatePeriodBounds } from "@/features/subscriptions/services";
import { decimalAmountSchema } from "@/lib/validation";

const invoiceSchema = z.object({
  amount: decimalAmountSchema({ min: 0.01 }),
  notes: z.string().max(5000).nullable().optional(),
});

export const POST = ownerRoute(async (request, { params }, owner) => {
  const { id: clinicId } = await params;
  const input = await readJson(request, invoiceSchema);

  const payment = await prisma.$transaction(async (tx) => {
    await lockClinic(tx, clinicId);
    const subscription = await tx.subscription.findFirst({
      where: { clinicId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { plan: true },
    });
    if (!subscription) throw new ApiError("Attribuez un plan avant de créer une facture.", 422);
    if (subscription.status === "trialing") {
      throw new ApiError("Une facture ne peut pas être créée pendant la période d’essai.", 422);
    }

    const pending = await tx.payment.findFirst({
      where: { clinicId, status: "pending" },
      select: { id: true },
    });
    if (pending) throw new ApiError("Ce cabinet possède déjà une facture en attente.", 422);

    const { periodStartsAt, periodEndsAt } = calculatePeriodBounds(
      subscription,
      subscription.plan,
    );
    return tx.payment.create({
      data: {
        clinicId,
        subscriptionId: subscription.id,
        amount: input.amount,
        currency: "MAD",
        status: "pending",
        method: null,
        reference: null,
        notes: input.notes || null,
        recordedBy: owner.id,
        periodStartsAt,
        periodEndsAt,
      },
    });
  });

  return Response.json({ payment }, { status: 201 });
});
