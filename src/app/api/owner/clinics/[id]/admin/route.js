import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  ApiError,
  lockClinic,
  ownerRoute,
  readJson,
} from "@/lib/owner-api";
import { strongPasswordSchema } from "@/lib/validation";

const adminSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(255),
  email: z.string().trim().email("Saisissez une adresse e-mail valide."),
  password: strongPasswordSchema,
});

export const POST = ownerRoute(async (request, { params }) => {
  const { id: clinicId } = await params;
  const input = await readJson(request, adminSchema);
  const email = input.email.toLowerCase();

  const admin = await prisma.$transaction(async (tx) => {
    await lockClinic(tx, clinicId);
    const clinic = await tx.clinic.findFirst({
      where: { id: clinicId, deletedAt: null },
      select: { id: true },
    });
    if (!clinic) throw new ApiError("Cabinet introuvable.", 404);

    const existingAdmin = await tx.clinicUser.findFirst({
      where: { clinicId, role: "clinic_admin", isActive: true },
      select: { userId: true },
    });
    if (existingAdmin) {
      throw new ApiError("Ce cabinet possède déjà un administrateur actif.", 409);
    }

    if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new ApiError("Un compte utilise déjà cette adresse e-mail.", 409);
    }

    const user = await tx.user.create({
      data: {
        name: input.name,
        email,
        password: await bcrypt.hash(input.password, 12),
      },
      select: { id: true, name: true, email: true },
    });
    await tx.clinicUser.create({
      data: {
        clinicId,
        userId: user.id,
        role: "clinic_admin",
        isActive: true,
        joinedAt: new Date(),
      },
    });
    return user;
  });

  return Response.json(admin, { status: 201 });
});
