import { prisma } from "@/lib/db/prisma";
import {
  ApiError,
  ownerRoute,
  parseListQuery,
} from "@/lib/owner-api";
import {
  isPlanLocked,
  normalizeExpiredSubscription,
} from "@/features/subscriptions/services";

export const GET = ownerRoute(async (request, { params }) => {
  const { id: slug } = await params;
  const clinic = await prisma.clinic.findFirst({
    where: { slug, deletedAt: null },
    include: {
      subscriptions: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        include: { plan: true },
      },
    },
  });
  if (!clinic) throw new ApiError("Cabinet introuvable.", 404);

  let subscription = clinic.subscriptions[0] ?? null;
  const normalized = normalizeExpiredSubscription(subscription);
  if (subscription && normalized.status !== subscription.status) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: normalized.status },
      include: { plan: true },
    });
  }

  const searchParams = new URL(request.url).searchParams;
  const query = parseListQuery(
    searchParams,
    ["amount", "created_at", "paid_at"],
    { sortBy: "created_at", sortDirection: "desc" },
  );
  const status = searchParams.get("status") ?? "all";
  if (!["all", "pending", "paid"].includes(status)) {
    throw new ApiError("Le filtre de statut est invalide.", 422);
  }
  const paymentsWhere = {
    clinicId: clinic.id,
    ...(status !== "all" ? { status } : {}),
    ...(query.search ? { reference: { contains: query.search } } : {}),
  };
  const orderBy =
    query.sortBy === "amount"
      ? "amount"
      : query.sortBy === "paid_at"
        ? "paidAt"
        : "createdAt";
  const now = new Date();
  const [
    payments,
    totalPayments,
    activePlans,
    hasPendingPayment,
    planLocked,
    currentPeriodPayment,
    nextPeriodPayment,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: paymentsWhere,
      orderBy: [{ [orderBy]: query.sortDirection }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { subscription: { include: { plan: true } } },
    }),
    prisma.payment.count({ where: paymentsWhere }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.payment.findFirst({
      where: { clinicId: clinic.id, status: "pending" },
      select: { id: true },
    }),
    prisma.$transaction((tx) => isPlanLocked(clinic.id, tx)),
    subscription && subscription.status !== "trialing"
      ? prisma.payment.findFirst({
          where: {
            subscriptionId: subscription.id,
            status: { in: ["paid", "pending"] },
            periodStartsAt: { lte: now },
            periodEndsAt: { gt: now },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: { status: true, periodStartsAt: true, periodEndsAt: true },
        })
      : Promise.resolve(null),
    subscription?.status === "active"
      ? prisma.payment.findFirst({
          where: {
            subscriptionId: subscription.id,
            status: "paid",
            periodStartsAt: { gt: now },
          },
          orderBy: [{ periodStartsAt: "asc" }, { id: "asc" }],
          select: { periodStartsAt: true, periodEndsAt: true },
        })
      : Promise.resolve(null),
  ]);

  let currentPeriod = null;
  if (subscription?.status === "trialing" && subscription.trialEndsAt) {
    let periodStartsAt = subscription.startsAt;
    if (!periodStartsAt) {
      periodStartsAt = new Date(subscription.trialEndsAt);
      periodStartsAt.setUTCDate(
        periodStartsAt.getUTCDate() - subscription.plan.trialDays,
      );
    }
    currentPeriod = {
      periodStartsAt,
      periodEndsAt: subscription.trialEndsAt,
    };
  } else if (currentPeriodPayment) {
    currentPeriod = {
      periodStartsAt: currentPeriodPayment.periodStartsAt,
      periodEndsAt: currentPeriodPayment.periodEndsAt,
    };
  } else if (
    ["active", "cancelled"].includes(subscription?.status) &&
    subscription.startsAt &&
    subscription.endsAt &&
    subscription.endsAt > now
  ) {
    currentPeriod = {
      periodStartsAt: subscription.startsAt,
      periodEndsAt: subscription.endsAt,
    };
  }
  const currentPeriodPaymentStatus =
    !subscription || subscription.status === "trialing"
      ? "unknown"
      : currentPeriodPayment?.status ?? "unpaid";

  return Response.json({
    clinic,
    subscription,
    payments,
    totalPayments,
    page: query.page,
    pageSize: query.pageSize,
    activePlans,
    hasPendingPayment: Boolean(hasPendingPayment),
    isPlanLocked: planLocked,
    currentPeriod,
    nextPeriod:
      subscription?.status === "active" && nextPeriodPayment
        ? {
            periodStartsAt: nextPeriodPayment.periodStartsAt,
            periodEndsAt: nextPeriodPayment.periodEndsAt,
          }
        : null,
    currentPeriodPaymentStatus,
  });
});
