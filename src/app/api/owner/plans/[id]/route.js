import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ApiError, ownerRoute, readJson } from "@/lib/owner-api";
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
const planUpdateSchema = planSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, "Aucune modification à appliquer.");
const idSchema = z.string().min(1);

export const PATCH = ownerRoute(async (request, { params }) => {
  const { id } = await params;
  idSchema.parse(id);
  const input = await readJson(request, planUpdateSchema);
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) throw new ApiError("Plan introuvable.", 404);
  const plan = await prisma.plan.update({ where: { id }, data: input });
  return Response.json({ plan });
});

export const DELETE = ownerRoute(async (_request, { params }) => {
  const { id } = await params;
  idSchema.parse(id);
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new ApiError("Plan introuvable.", 404);
  if (await prisma.subscription.count({ where: { planId: id } })) {
    throw new ApiError("Un plan associé à un abonnement ne peut pas être supprimé.", 422);
  }
  await prisma.plan.delete({ where: { id } });
  return Response.json({ success: true });
});
