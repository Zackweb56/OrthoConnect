import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ownerRoute,
  parseListQuery,
  readJson,
} from "@/lib/owner-api";
import { decimalAmountSchema, wholeNumberSchema } from "@/lib/validation";

const planSchema = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[A-Za-z0-9_-]+$/, "Utilisez des lettres, des chiffres, des tirets ou des tirets bas."),
  price: decimalAmountSchema(),
  billingInterval: z.enum(["monthly", "yearly"]),
  trialDays: wholeNumberSchema,
  isActive: z.boolean(),
});

export const GET = ownerRoute(async (request) => {
  const query = parseListQuery(
    new URL(request.url).searchParams,
    ["name", "price", "billingInterval", "trialDays", "isActive"],
    { sortBy: "name", sortDirection: "asc" },
  );
  const where = query.search
    ? {
        OR: [
          { name: { contains: query.search } },
          { slug: { contains: query.search } },
        ],
      }
    : {};
  const [rows, total] = await Promise.all([
    prisma.plan.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { [query.sortBy]: query.sortDirection },
    }),
    prisma.plan.count({ where }),
  ]);
  return Response.json({ rows, total, page: query.page, pageSize: 10 });
});

export const POST = ownerRoute(async (request) => {
  const input = await readJson(request, planSchema);
  const plan = await prisma.plan.create({ data: input });
  return Response.json({ plan }, { status: 201 });
});
