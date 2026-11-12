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
  const clinics = await prisma.clinic.findMany({
    where: {
      deletedAt: null,
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      subscriptions: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: {
          id: true,
          status: true,
          plan: { select: { price: true } },
        },
      },
    },
  });
  return Response.json({
    clinics: clinics
      .filter((clinic) =>
        ["active", "past_due", "cancelled"].includes(
          clinic.subscriptions[0]?.status,
        ),
      )
      .map((clinic) => ({
        id: clinic.id,
        name: clinic.name,
        subscription: clinic.subscriptions[0],
      })),
  });
});
