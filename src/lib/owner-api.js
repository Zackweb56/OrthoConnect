import { auth } from "../../auth";
import { z } from "zod";

export class ApiError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function ownerRoute(handler) {
  return auth(async (request, context) => {
    try {
      const user = request.auth?.user;
      if (user?.isPlatformOwner !== true) {
        return Response.json({ error: "Accès interdit." }, { status: 403 });
      }
      return await handler(request, context, user);
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json(
          { error: error.message, details: error.details },
          { status: error.status },
        );
      }

      if (error?.name === "ZodError") {
        return Response.json(
          { error: "Les informations saisies sont invalides.", details: error.flatten() },
          { status: 422 },
        );
      }

      if (error?.code === "P2002") {
        return Response.json(
          { error: "Un enregistrement avec ces valeurs existe déjà." },
          { status: 409 },
        );
      }

      if (error?.code === "P2003") {
        return Response.json(
          { error: "Cet enregistrement est encore utilisé et ne peut pas être modifié." },
          { status: 409 },
        );
      }

      console.error("Owner API request failed:", error);
      return Response.json({ error: "Une erreur inattendue est survenue." }, { status: 500 });
    }
  });
}

export async function readJson(request, schema) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    throw new ApiError("Le contenu de la requête est invalide.", 400);
  }
  return schema.parse(payload);
}

export async function lockClinic(tx, clinicId) {
  await tx.$queryRaw`SELECT id FROM clinics WHERE id = ${clinicId} FOR UPDATE`;
}

export async function lockPayment(tx, paymentId) {
  await tx.$queryRaw`SELECT id FROM payments WHERE id = ${paymentId} FOR UPDATE`;
}

export function parseListQuery(searchParams, allowedSort, defaults = {}) {
  const parsed = z
    .object({
      page: z
        .string()
        .default("1")
        .transform(Number)
        .pipe(z.number().int().min(1)),
      search: z.string().trim().max(255).default(""),
      sortBy: z
        .string()
        .default(defaults.sortBy)
        .refine((field) => allowedSort.includes(field)),
      sortDirection: z.enum(["asc", "desc"]).default(defaults.sortDirection),
    })
    .parse({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortDirection: searchParams.get("sortDirection") ?? undefined,
    });

  return {
    page: parsed.page,
    pageSize: 10,
    search: parsed.search,
    sortBy: parsed.sortBy,
    sortDirection: parsed.sortDirection,
  };
}
