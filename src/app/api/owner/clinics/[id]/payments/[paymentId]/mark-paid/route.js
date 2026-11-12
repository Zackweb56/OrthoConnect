import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ApiError,
  lockClinic,
  lockPayment,
  ownerRoute,
  readJson,
} from "@/lib/owner-api";
import {
  addInterval,
  extendSubscriptionFromPayment,
} from "@/features/subscriptions/services";

const markPaidSchema = z
  .object({
    method: z.enum(["cash", "bank_transfer"]),
    reference: z.string().max(255).nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.method === "bank_transfer" && !value.reference?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["reference"],
        message: "Une référence est obligatoire pour les virements bancaires.",
      });
    }
  });

export const POST = ownerRoute(async (request, { params }, owner) => {
  const { id: clinicId, paymentId } = await params;
  const input = await readJson(request, markPaidSchema);

  const result = await prisma.$transaction(async (tx) => {
    const initial = await tx.payment.findFirst({
      where: { id: paymentId, clinicId },
      select: { id: true },
    });
    if (!initial) throw new ApiError("Paiement introuvable.", 404);
    await lockClinic(tx, clinicId);
    await lockPayment(tx, paymentId);
    const pending = await tx.payment.findFirst({
      where: { id: paymentId, clinicId, status: "pending" },
    });
    if (!pending) {
      throw new ApiError(
        "Seul un paiement en attente peut être marqué comme payé.",
        422,
      );
    }
    const subscription = await tx.subscription.findFirst({
      where: { id: pending.subscriptionId, clinicId },
      include: { plan: true },
    });
    if (!subscription) {
      throw new ApiError("L’abonnement associé au paiement est introuvable.", 409);
    }

    const now = new Date();
    let periodStartsAt = pending.periodStartsAt;
    let periodEndsAt = pending.periodEndsAt;
    if (periodEndsAt) {
      periodStartsAt ??=
        subscription.endsAt && subscription.endsAt > now
          ? subscription.endsAt
          : now;
    } else if (
      ["trialing", "past_due", "cancelled"].includes(subscription.status)
    ) {
      periodStartsAt = now;
      periodEndsAt = addInterval(periodStartsAt, subscription.plan.billingInterval);
    } else {
      const hasFutureEnd = subscription.endsAt && subscription.endsAt > now;
      periodStartsAt = hasFutureEnd ? subscription.endsAt : now;
      periodEndsAt = addInterval(
        hasFutureEnd ? subscription.endsAt : now,
        subscription.plan.billingInterval,
      );
    }

    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "paid",
        paidAt: now,
        method: input.method,
        reference: input.reference || null,
        notes: input.notes || null,
        recordedBy: owner.id,
        periodStartsAt,
        periodEndsAt,
      },
    });
    const extended = extendSubscriptionFromPayment(
      subscription,
      payment,
      subscription.plan,
      now,
    );
    const updatedSubscription =
      extended === subscription
        ? subscription
        : await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: extended.status,
              trialEndsAt: extended.trialEndsAt,
              cancelledAt: extended.cancelledAt,
              startsAt: extended.startsAt,
              endsAt: extended.endsAt,
            },
          });
    return { payment, subscription: updatedSubscription };
  });
  return Response.json(result);
});
