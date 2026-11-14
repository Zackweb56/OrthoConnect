import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { cabinetRoute } from "@/lib/cabinet-api";
import { ApiError, readJson } from "@/lib/owner-api";

const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saisissez une heure valide.")
  .nullable();
const dayHoursSchema = z.object({
  isOpen: z.boolean(),
  opensAt: timeSchema,
  closesAt: timeSchema,
});
const openingHoursSchema = z
  .object(
    Object.fromEntries(weekdays.map((day) => [day, dayHoursSchema])),
  )
  .superRefine((schedule, context) => {
    for (const day of weekdays) {
      const hours = schedule[day];
      if (!hours.isOpen) continue;
      if (!hours.opensAt) {
        context.addIssue({
          code: "custom",
          path: [day, "opensAt"],
          message: "Indiquez une heure d’ouverture.",
        });
      }
      if (!hours.closesAt) {
        context.addIssue({
          code: "custom",
          path: [day, "closesAt"],
          message: "Indiquez une heure de fermeture.",
        });
      } else if (hours.opensAt && hours.opensAt >= hours.closesAt) {
        context.addIssue({
          code: "custom",
          path: [day, "closesAt"],
          message: "La fermeture doit être après l’ouverture.",
        });
      }
    }
  });

function isValidLogoPath(value) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    logoPath: z
      .string()
      .trim()
      .max(2048)
      .nullable()
      .optional()
      .refine(isValidLogoPath, "Utilisez un chemin local ou une URL HTTP(S) publique."),
    phone: z.string().trim().max(255).nullable().optional(),
    email: z
      .union([z.string().trim().email().max(255), z.literal("")])
      .nullable()
      .optional()
      .transform((value) => (value === "" ? null : value)),
    address: z.string().trim().max(1000).nullable().optional(),
    city: z.string().trim().max(255).nullable().optional(),
    timezone: z
      .string()
      .trim()
      .min(1, "Le fuseau horaire est obligatoire.")
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("fr-FR", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, "Saisissez un fuseau horaire IANA valide.")
      .optional(),
    openingHours: openingHoursSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Modifiez au moins un champ.",
  });

export const GET = cabinetRoute("clinic.view", async (_request, _context, { clinicId }) => {
  const clinic = await prisma.clinic.findFirst({
    where: { id: clinicId, deletedAt: null },
    select: {
      id: true,
      name: true,
      logoPath: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      timezone: true,
      openingHours: true,
    },
  });
  if (!clinic) throw new ApiError("Cabinet introuvable.", 404);
  return Response.json({ clinic });
});

export const PATCH = cabinetRoute(
  "clinic.update",
  async (request, _context, { clinicId }) => {
    const input = await readJson(request, profileSchema);
    const result = await prisma.clinic.updateMany({
      where: { id: clinicId, deletedAt: null },
      data: input,
    });
    if (!result.count) throw new ApiError("Cabinet introuvable.", 404);

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        logoPath: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        timezone: true,
        openingHours: true,
      },
    });
    return Response.json({ clinic });
  },
);
