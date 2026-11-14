import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { cabinetRoute } from "@/lib/cabinet-api";
import {
  ApiError,
  lockClinic,
  parseListQuery,
  readJson,
} from "@/lib/owner-api";
import { findClinicRoleByName } from "@/lib/permissions";
import { strongPasswordSchema } from "@/lib/validation";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(255),
  email: z.string().trim().email("Saisissez une adresse e-mail valide.").max(255),
  password: strongPasswordSchema,
  role: z.string().trim().min(1, "Sélectionnez un rôle.").max(100),
});

export const GET = cabinetRoute(
  "users.view",
  async (request, _context, { clinicId, session }) => {
    const searchParams = new URL(request.url).searchParams;
    const query = parseListQuery(
      searchParams,
      ["name", "email", "role", "isActive"],
      { sortBy: "name", sortDirection: "asc" },
    );
    const status = searchParams.get("status") ?? "all";
    if (!["all", "active", "inactive"].includes(status)) {
      throw new ApiError("Le filtre de statut est invalide.", 422);
    }

    const where = {
      clinicId,
      userId: { not: session.user.id },
      ...(status === "all" ? {} : { isActive: status === "active" }),
      ...(searchParams.get("role") ? { role: searchParams.get("role") } : {}),
      ...(query.search
        ? {
            user: {
              is: {
                OR: [
                  { name: { contains: query.search } },
                  { email: { contains: query.search } },
                ],
              },
            },
          }
        : {}),
    };
    const orderBy =
      query.sortBy === "role" || query.sortBy === "isActive"
        ? { [query.sortBy]: query.sortDirection }
        : { user: { [query.sortBy]: query.sortDirection } };

    const [memberships, total, roles] = await Promise.all([
      prisma.clinicUser.findMany({
        where,
        orderBy: [orderBy, { userId: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          role: true,
          isActive: true,
          joinedAt: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.clinicUser.count({ where }),
      prisma.role.findMany({
        where: {
          OR: [{ clinicId: null, isSystem: true }, { clinicId, isSystem: false }],
          name: { not: "responsable" },
        },
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        select: { name: true, isSystem: true },
      }),
    ]);

    return Response.json({
      users: memberships.map(({ user, role, isActive, joinedAt }) => ({
        ...user,
        role,
        isActive,
        joinedAt,
      })),
      roles,
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  },
);

export const POST = cabinetRoute(
  "users.create",
  async (request, _context, { clinicId }) => {
    const input = await readJson(request, createUserSchema);
    if (input.role === "responsable") {
      throw new ApiError("Sélectionnez un rôle de membre du cabinet.", 422);
    }
    const email = input.email.toLowerCase();
    const password = await bcrypt.hash(input.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      await lockClinic(tx, clinicId);
      const role = await findClinicRoleByName(clinicId, input.role, tx);
      if (!role) throw new ApiError("Sélectionnez un rôle valide.", 422);

      if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
        throw new ApiError("Un compte utilise déjà cette adresse e-mail.", 409);
      }

      if (
        role.name === "clinic_admin" &&
        (await tx.clinicUser.findFirst({
          where: { clinicId, role: "clinic_admin", isActive: true },
          select: { userId: true },
        }))
      ) {
        throw new ApiError("Ce cabinet possède déjà un administrateur actif.", 409);
      }

      const createdUser = await tx.user.create({
        data: { name: input.name, email, password },
        select: { id: true, name: true, email: true },
      });
      await tx.clinicUser.create({
        data: {
          clinicId,
          userId: createdUser.id,
          role: role.name,
          isActive: true,
        },
      });
      return createdUser;
    });

    return Response.json({ user }, { status: 201 });
  },
);
