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

const permissions = [
  { name: "users.view", group: "Users" },
  { name: "users.create", group: "Users" },
  { name: "users.update", group: "Users" },
  { name: "users.delete", group: "Users" },
  { name: "roles.view", group: "Roles" },
  { name: "roles.manage", group: "Roles" },
  { name: "clinic.view", group: "Clinic" },
  { name: "clinic.update", group: "Clinic" },
];

async function seedClinicRolesAndPermissions() {
  const permissionsByName = new Map();
  for (const permission of permissions) {
    const savedPermission = await prisma.permission.upsert({
      where: { name: permission.name },
      update: { group: permission.group },
      create: permission,
    });
    permissionsByName.set(permission.name, savedPermission);
  }

  const roles = [
    { name: "clinic_admin", permissions: permissions.map(({ name }) => name) },
  ];

  for (const roleDefinition of roles) {
    let role = await prisma.role.findFirst({
      where: {
        name: roleDefinition.name,
        isSystem: true,
        clinicId: null,
      },
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleDefinition.name,
          isSystem: true,
          clinicId: null,
        },
      });
    }

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (roleDefinition.permissions.length) {
      await prisma.rolePermission.createMany({
        data: roleDefinition.permissions.map((permissionName) => ({
          roleId: role.id,
          permissionId: permissionsByName.get(permissionName).id,
        })),
      });
    }
  }

  console.info("Clinic roles and permissions are ready.");
}

Promise.all([seedPlatformOwner(), seedClinicRolesAndPermissions()])
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
