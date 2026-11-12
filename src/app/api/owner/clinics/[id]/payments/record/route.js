import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ApiError,
  lockClinic,
  ownerRoute,
  readJson,
} from "@/lib/owner-api";
import {
  addInterval,
  extendSubscriptionFromPayment,
} from "@/features/subscriptions/services";
import { decimalAmountSchema } from "@/lib/validation";

const recordSchema = z
  .object({
    amount: decimalAmountSchema({ min: 0.01 }),
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
  const { id: clinicId } = await params;
  const input = await readJson(request, recordSchema);

  const result = await prisma.$transaction(async (tx) => {
    await lockClinic(tx, clinicId);
    const subscription = await tx.subscription.findFirst({
      where: { clinicId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { plan: true },
    });
    if (!subscription) throw new ApiError("Attribuez un plan avant d’enregistrer un paiement.", 422);

    const now = new Date();
    const pending = await tx.payment.findFirst({
      where: { clinicId, status: "pending" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    let periodStartsAt;
    let periodEndsAt;
    let payment;

    if (pending) {
      periodStartsAt = pending.periodStartsAt;
      periodEndsAt = pending.periodEndsAt;
      if (!periodStartsAt || !periodEndsAt) {
        periodStartsAt =
          subscription.endsAt && subscription.endsAt > now
            ? subscription.endsAt
            : now;
        periodEndsAt = addInterval(periodStartsAt, subscription.plan.billingInterval);
      }
      payment = await tx.payment.update({
        where: { id: pending.id },
        data: {
          amount: input.amount,
          status: "paid",
          method: input.method,
          reference: input.reference || null,
          notes: input.notes || null,
          paidAt: now,
          recordedBy: owner.id,
          periodStartsAt,
          periodEndsAt,
        },
      });
    } else {
      const startFromNow =
        ["trialing", "past_due", "cancelled"].includes(subscription.status) ||
        !subscription.endsAt ||
        subscription.endsAt < now;
      periodStartsAt = startFromNow ? now : subscription.endsAt;
      periodEndsAt = addInterval(periodStartsAt, subscription.plan.billingInterval);
      payment = await tx.payment.create({
        data: {
          clinicId,
          subscriptionId: subscription.id,
          amount: input.amount,
          currency: "MAD",
          status: "paid",
          method: input.method,
          reference: input.reference || null,
          notes: input.notes || null,
          paidAt: now,
          recordedBy: owner.id,
          periodStartsAt,
          periodEndsAt,
        },
      });
    }

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
              startsAt: extended.startsAt,
              endsAt: extended.endsAt,
              trialEndsAt: extended.trialEndsAt,
              cancelledAt: extended.cancelledAt,
            },
          });
    return { payment, subscription: updatedSubscription };
  });

  return Response.json(result, { status: 201 });
});
