import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../src/lib/db/prisma.js";

const ownerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z
    .string()
    .min(12)
    .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
      message: "Password must not exceed bcrypt's 72-byte limit.",
    }),
});

async function seedPlatformOwner() {
  const owner = ownerSchema.parse({
    name: process.env.PLATFORM_OWNER_NAME,
    email: process.env.PLATFORM_OWNER_EMAIL,
    password: process.env.PLATFORM_OWNER_PASSWORD,
  });
  const email = owner.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (!existing.isPlatformOwner) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { isPlatformOwner: true },
      });
    }
    console.info(`Platform Owner is ready for ${email}.`);
    return;
  }

  await prisma.user.create({
    data: {
      name: owner.name,
      email,
      password: await bcrypt.hash(owner.password, 12),
      isPlatformOwner: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.info(`Created Platform Owner ${email}.`);
}

seedPlatformOwner()
  .catch((error) => {
    console.error("Platform Owner seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
