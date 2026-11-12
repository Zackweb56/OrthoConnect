import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { lockClinic, ownerRoute, readJson } from "@/lib/owner-api";

const cancelSchema = z.object({ confirm: z.literal(true) });

export const POST = ownerRoute(async (request, { params }) => {
  const { id: clinicId } = await params;
  await readJson(request, cancelSchema);

  const subscription = await prisma.$transaction(async (tx) => {
    await lockClinic(tx, clinicId);
    const current = await tx.subscription.findFirst({
      where: { clinicId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    if (!current) return null;

    const now = new Date();
    const paidPeriod = await tx.payment.findFirst({
      where: {
        clinicId,
        subscriptionId: current.id,
        status: "paid",
        periodStartsAt: { lte: now },
        periodEndsAt: { gt: now },
      },
      select: { id: true },
    });
    const updated = await tx.subscription.update({
      where: { id: current.id },
      data: {
        status: "cancelled",
        cancelledAt: now,
        ...(!paidPeriod ? { endsAt: now } : {}),
      },
    });

    if (!paidPeriod) {
      await tx.payment.deleteMany({
        where: {
          clinicId,
          subscriptionId: current.id,
          status: "pending",
        },
      });
    }
    return updated;
  });

  return Response.json({ subscription });
});
