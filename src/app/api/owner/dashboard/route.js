import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ownerRoute } from "@/lib/owner-api";

const querySchema = z.object({
  search: z.string().trim().max(255).default(""),
});

export const GET = ownerRoute(async (request) => {
  const { search } = querySchema.parse({
    search: new URL(request.url).searchParams.get("search") ?? undefined,
  });
  const [totalClinics, activeSubscriptions, revenue, recentClinics] =
    await Promise.all([
      prisma.clinic.count({ where: { deletedAt: null } }),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.payment.aggregate({
        where: { status: "paid" },
        _sum: { amount: true },
      }),
      prisma.clinic.findMany({
        where: {
          deletedAt: null,
          ...(search
            ? {
                OR: [
                  { name: { contains: search } },
                  { city: { contains: search } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          city: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

  return Response.json({
    totalClinics,
    activeSubscriptions,
    totalRevenue: revenue._sum.amount?.toString() ?? "0.00",
    recentClinics,
  });
});
