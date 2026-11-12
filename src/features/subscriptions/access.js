import { prisma } from "@/lib/db/prisma";
import { normalizeExpiredSubscription } from "./services";

export async function findFirstClinicSlugForUser(userId) {
  const membership = await prisma.clinicUser.findFirst({
    where: {
      userId,
      isActive: true,
      clinic: { is: { deletedAt: null } },
    },
    orderBy: { joinedAt: "asc" },
    select: { clinic: { select: { slug: true } } },
  });

  return membership?.clinic.slug ?? null;
}

export async function getClinicAccessContext(userId, clinicSlug, now = new Date()) {
  const membership = await prisma.clinicUser.findFirst({
    where: {
      userId,
      isActive: true,
      clinic: { is: { slug: clinicSlug, deletedAt: null } },
    },
    include: {
      clinic: {
        include: {
          subscriptions: {
            orderBy: { id: "desc" },
            take: 1,
            include: { plan: true },
          },
        },
      },
    },
  });

  if (!membership) return null;

  const clinic = membership.clinic;
  const latestSubscription = clinic.subscriptions[0] ?? null;
  let subscription = latestSubscription;

  if (latestSubscription) {
    const normalized = normalizeExpiredSubscription(latestSubscription, now);
    if (normalized !== latestSubscription) {
      subscription = await prisma.subscription.update({
        where: { id: latestSubscription.id },
        data: { status: normalized.status },
        include: { plan: true },
      });
    }
  }

  const reason = getClinicAccessReason(clinic, subscription, now);

  return {
    clinic,
    subscription,
    reason,
    isAllowed: isClinicAccessAllowed(clinic, subscription, now),
  };
}

export function getClinicAccessReason(clinic, subscription, now = new Date()) {
  if (!clinic.isActive) return "suspended_by_owner";
  if (!subscription) return "no_subscription";

  if (
    subscription.status === "trialing" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt > now
  ) {
    return "trial_valid";
  }

  if (
    subscription.status === "active" &&
    (!subscription.endsAt || subscription.endsAt > now)
  ) {
    return "active_valid";
  }

  if (subscription.status === "trialing") return "expired_trial";
  if (subscription.status === "cancelled") return "cancelled";
  if (
    subscription.status === "past_due" ||
    (subscription.endsAt && subscription.endsAt <= now)
  ) {
    return "past_due";
  }

  return "past_due";
}

export function isClinicAccessAllowed(clinic, subscription, now = new Date()) {
  if (!clinic.isActive || !subscription) return false;

  if (
    subscription.status === "active" &&
    (!subscription.endsAt || subscription.endsAt > now)
  ) {
    return true;
  }

  if (
    subscription.status === "trialing" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt > now
  ) {
    return true;
  }

  return (
    subscription.status === "cancelled" &&
    subscription.endsAt &&
    subscription.endsAt > now
  );
}
