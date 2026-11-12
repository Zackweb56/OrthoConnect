export function addInterval(date, billingInterval) {
  const result = new Date(date);
  const day = result.getUTCDate();
  const monthDelta = billingInterval === "yearly" ? 12 : 1;
  const targetMonth = result.getUTCMonth() + monthDelta;

  result.setUTCDate(1);
  result.setUTCMonth(targetMonth);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));

  return result;
}

export function normalizeExpiredSubscription(subscription, now = new Date()) {
  if (!subscription) return subscription;

  const trialExpired =
    subscription.status === "trialing" &&
    (!subscription.trialEndsAt || subscription.trialEndsAt <= now);
  const periodExpired =
    subscription.status === "active" &&
    subscription.endsAt &&
    subscription.endsAt <= now;
  const cancelledPeriodExpired =
    subscription.status === "cancelled" &&
    (!subscription.endsAt || subscription.endsAt <= now);

  return trialExpired || periodExpired || cancelledPeriodExpired
    ? { ...subscription, status: "past_due" }
    : subscription;
}

export function extendSubscriptionFromPayment(
  subscription,
  payment,
  plan,
  now = new Date(),
) {
  if (!subscription || !payment || !plan) return subscription;

  const startsAt =
    payment.periodStartsAt ??
    (subscription.endsAt && subscription.endsAt > now
      ? subscription.endsAt
      : now);
  const endsAt =
    payment.periodEndsAt ?? addInterval(startsAt, plan.billingInterval);

  if (["trialing", "past_due", "cancelled"].includes(subscription.status)) {
    return {
      ...subscription,
      status: "active",
      trialEndsAt: null,
      cancelledAt: null,
      startsAt,
      endsAt,
    };
  }

  if (
    subscription.status === "active" &&
    endsAt &&
    (!subscription.endsAt || endsAt > subscription.endsAt)
  ) {
    return { ...subscription, startsAt, endsAt };
  }

  return subscription;
}

export async function isPlanLocked(clinicId, tx, now = new Date()) {
  const subscription = await tx.subscription.findFirst({
    where: { clinicId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  if (
    subscription?.status === "trialing" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt > now
  ) {
    return true;
  }

  return Boolean(
    await tx.payment.findFirst({
      where: {
        clinicId,
        status: { in: ["paid", "pending"] },
        periodStartsAt: { lte: now },
        periodEndsAt: { gt: now },
      },
      select: { id: true },
    }),
  );
}

export function calculatePeriodBounds(
  subscription,
  plan,
  now = new Date(),
) {
  const hasExpiredEnd = !subscription?.endsAt || subscription.endsAt < now;
  const startsAt =
    subscription?.status === "past_due" || hasExpiredEnd
      ? now
      : subscription.endsAt;

  return {
    periodStartsAt: startsAt,
    periodEndsAt: addInterval(startsAt, plan.billingInterval),
  };
}

export function generateSlug(name, existingSlugs = []) {
  const base = name.trim().toLowerCase().replace(/\s+/g, "-") || "clinic";
  const slugs = new Set(existingSlugs);
  if (!slugs.has(base)) return base;

  let suffix = 2;
  while (slugs.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
