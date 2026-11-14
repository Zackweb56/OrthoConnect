import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { cabinetAccountRoute } from "@/lib/cabinet-api";
import { ApiError, readJson } from "@/lib/owner-api";
import { strongPasswordSchema } from "@/lib/validation";

const profileSchema = z
  .object({
    name: z.string().trim().min(1, "Le nom est obligatoire.").max(255),
    email: z
      .string()
      .trim()
      .email("Saisissez une adresse e-mail valide.")
      .max(255),
    currentPassword: z.string().optional(),
    password: strongPasswordSchema.optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((input, context) => {
    const changingPassword = Boolean(
      input.currentPassword || input.password || input.confirmPassword,
    );
    if (!changingPassword) return;

    if (!input.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["currentPassword"],
        message: "Saisissez votre mot de passe actuel.",
      });
    }
    if (!input.password) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "Saisissez un nouveau mot de passe.",
      });
    }
    if (!input.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Confirmez votre nouveau mot de passe.",
      });
    } else if (input.password && input.password !== input.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Les deux mots de passe ne correspondent pas.",
      });
    }
  });

export const GET = cabinetAccountRoute(
  async (_request, _context, { session }) => {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw new ApiError("Compte introuvable.", 404);
    return Response.json({ user });
  },
);

export const PATCH = cabinetAccountRoute(
  async (request, _context, { session }) => {
    const input = await readJson(request, profileSchema);
    const email = input.email.toLowerCase();
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, password: true },
    });
    if (!currentUser) throw new ApiError("Compte introuvable.", 404);

    if (email !== currentUser.email) {
      const emailOwner = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (emailOwner) {
        throw new ApiError("Un compte utilise déjà cette adresse e-mail.", 409, {
          fieldErrors: {
            email: ["Cette adresse e-mail est déjà utilisée par un autre compte."],
          },
          formErrors: [],
        });
      }
    }

    if (input.currentPassword || input.password || input.confirmPassword) {
      if (!(await bcrypt.compare(input.currentPassword ?? "", currentUser.password))) {
        throw new ApiError("Le mot de passe actuel est incorrect.", 422, {
          fieldErrors: {
            currentPassword: ["Le mot de passe actuel est incorrect."],
          },
          formErrors: [],
        });
      }
    }

    const password = input.password
      ? await bcrypt.hash(input.password, 12)
      : undefined;
    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: input.name,
        email,
        ...(password ? { password } : {}),
      },
      select: { id: true, name: true, email: true },
    });
    return Response.json({ user });
  },
);
