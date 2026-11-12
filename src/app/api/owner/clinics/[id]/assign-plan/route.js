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
  isPlanLocked,
} from "@/features/subscriptions/services";

const assignPlanSchema = z.object({
  planId: z.string().min(1),
});

export const POST = ownerRoute(async (request, { params }, owner) => {
  const { id: clinicId } = await params;
  const input = await readJson(request, assignPlanSchema);

  const result = await prisma.$transaction(async (tx) => {
    await lockClinic(tx, clinicId);
    const clinic = await tx.clinic.findFirst({
      where: { id: clinicId, deletedAt: null },
      select: { id: true },
    });
    if (!clinic) throw new ApiError("Cabinet introuvable.", 404);
    if (await isPlanLocked(clinicId, tx)) {
      throw new ApiError("Le plan reste verrouillé jusqu’à la fin du cycle ou son annulation.", 422);
    }

    const plan = await tx.plan.findFirst({
      where: { id: input.planId, isActive: true },
    });
    if (!plan) throw new ApiError("Sélectionnez un plan actif.", 422);

    const now = new Date();
    const subscription = await tx.subscription.findFirst({
      where: { clinicId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    if (plan.trialDays > 0) {
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);
      const values = {
        planId: plan.id,
        status: "trialing",
        startsAt: now,
        endsAt: trialEndsAt,
        trialEndsAt,
        cancelledAt: null,
      };
      const updated = subscription
        ? await tx.subscription.update({
            where: { id: subscription.id },
            data: values,
            include: { plan: true },
          })
        : await tx.subscription.create({
            data: { clinicId, ...values },
            include: { plan: true },
          });
      await tx.payment.deleteMany({ where: { clinicId, status: "pending" } });
      return { subscription: updated, payment: null, isTrial: true };
    }

    const endsAt = addInterval(now, plan.billingInterval);
    const values = {
      planId: plan.id,
      status: "active",
      startsAt: now,
      endsAt,
      trialEndsAt: null,
      cancelledAt: null,
    };
    const updated = subscription
      ? await tx.subscription.update({
          where: { id: subscription.id },
          data: values,
          include: { plan: true },
        })
      : await tx.subscription.create({
          data: { clinicId, ...values },
          include: { plan: true },
        });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const pending = await tx.payment.findFirst({
      where: {
        clinicId,
        status: "pending",
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    const paymentData = {
      amount: plan.price,
      subscriptionId: updated.id,
      periodStartsAt: now,
      periodEndsAt: endsAt,
      currency: "MAD",
      method: null,
      recordedBy: owner.id,
    };
    const payment = pending
      ? await tx.payment.update({
          where: { id: pending.id },
          data: { ...paymentData, createdAt: now },
        })
      : await tx.payment.create({
          data: {
            clinicId,
            ...paymentData,
            status: "pending",
          },
        });

    return { subscription: updated, payment, isTrial: false };
  });

  return Response.json(result);
});
