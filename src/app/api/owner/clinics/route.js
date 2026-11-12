import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ApiError,
  ownerRoute,
  parseListQuery,
  readJson,
} from "@/lib/owner-api";
import {
  generateSlug,
  normalizeExpiredSubscription,
} from "@/features/subscriptions/services";

const clinicSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    phone: z.string().trim().max(255).nullable().optional(),
    city: z.string().trim().max(255).nullable().optional(),
  });

export const GET = ownerRoute(async (request) => {
  const query = parseListQuery(
    new URL(request.url).searchParams,
    ["name", "city", "phone", "createdAt", "isActive"],
    { sortBy: "createdAt", sortDirection: "desc" },
  );
  const where = {
    deletedAt: null,
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search } },
            { city: { contains: query.search } },
            { phone: { contains: query.search } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.clinic.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { [query.sortBy]: query.sortDirection },
      select: {
        id: true,
        slug: true,
        name: true,
        phone: true,
        city: true,
        isActive: true,
        createdAt: true,
        subscriptions: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          select: {
            status: true,
            endsAt: true,
            trialEndsAt: true,
            plan: { select: { name: true } },
          },
        },
        users: {
          where: { role: "clinic_admin", isActive: true },
          take: 1,
          select: { user: { select: { id: true } } },
        },
      },
    }),
    prisma.clinic.count({ where }),
  ]);
  const normalizedRows = rows.map((clinic) => ({
    ...clinic,
    subscriptions: clinic.subscriptions.map((subscription) => ({
      plan: subscription.plan,
      status: normalizeExpiredSubscription(subscription).status,
    })),
  }));
  return Response.json({
    rows: normalizedRows,
    total,
    page: query.page,
    pageSize: query.pageSize,
  });
});

export const POST = ownerRoute(async (request) => {
  const input = await readJson(request, clinicSchema);
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.clinic.findMany({ select: { slug: true } });
    return tx.clinic.create({
      data: {
        name: input.name,
        slug: generateSlug(
          input.name,
          existing.map((item) => item.slug),
        ),
        phone: input.phone || null,
        city: input.city || null,
      },
    });
  });

  return Response.json(result, { status: 201 });
});
