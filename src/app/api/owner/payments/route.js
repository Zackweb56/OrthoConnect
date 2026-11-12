import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ApiError,
  lockClinic,
  ownerRoute,
  parseListQuery,
  readJson,
} from "@/lib/owner-api";
import { addInterval } from "@/features/subscriptions/services";
import { decimalAmountSchema } from "@/lib/validation";

const invoiceSchema = z.object({
  clinicId: z.string().min(1),
  amount: decimalAmountSchema({ min: 0.01 }),
  notes: z.string().max(5000).nullable().optional(),
});

const listQuerySchema = z.object({
  status: z.enum(["all", "pending", "paid"]).default("all"),
});

export const GET = ownerRoute(async (request) => {
  const searchParams = new URL(request.url).searchParams;
  const query = parseListQuery(
    searchParams,
    ["clinic", "amount", "created_at", "paid_at"],
    { sortBy: "created_at", sortDirection: "desc" },
  );
  const { status } = listQuerySchema.parse({
    status: searchParams.get("status") ?? "all",
  });
  const where = {
    ...(status !== "all" ? { status } : {}),
    ...(query.search
      ? {
          OR: [
            { reference: { contains: query.search } },
            { clinic: { name: { contains: query.search } } },
          ],
        }
      : {}),
  };
  const orderBy =
    query.sortBy === "clinic"
      ? { clinic: { name: query.sortDirection } }
      : { [query.sortBy === "created_at" ? "createdAt" : query.sortBy === "paid_at" ? "paidAt" : "amount"]: query.sortDirection };
  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: [orderBy, { id: "desc" }],
      include: {
        clinic: { select: { id: true, name: true, slug: true } },
        subscription: { include: { plan: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);
  return Response.json({
    rows,
    total,
    page: query.page,
    pageSize: query.pageSize,
  });
});

export const POST = ownerRoute(async (request, _context, owner) => {
  const input = await readJson(request, invoiceSchema);
  const payment = await prisma.$transaction(async (tx) => {
    await lockClinic(tx, input.clinicId);
    const clinic = await tx.clinic.findFirst({
      where: { id: input.clinicId, deletedAt: null },
    });
    if (!clinic) throw new ApiError("Cabinet introuvable.", 404);
    const subscription = await tx.subscription.findFirst({
      where: { clinicId: clinic.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { plan: true },
    });
    if (!subscription) throw new ApiError("Attribuez un plan avant de créer une facture.", 422);
    if (subscription.status === "trialing") {
      throw new ApiError("Une facture ne peut pas être créée pendant la période d’essai.", 422);
    }
    if (
      await tx.payment.findFirst({
        where: { clinicId: clinic.id, status: "pending" },
        select: { id: true },
      })
    ) {
      throw new ApiError("Ce cabinet possède déjà une facture en attente.", 422);
    }

    const now = new Date();
    const periodStartsAt =
      subscription.endsAt && subscription.endsAt > now
        ? subscription.endsAt
        : now;
    const periodEndsAt = addInterval(
      periodStartsAt,
      subscription.plan.billingInterval,
    );
    return tx.payment.create({
      data: {
        clinicId: clinic.id,
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
