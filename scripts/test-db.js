import { prisma } from '../src/lib/db/prisma.js';

async function main() {
  const count = await prisma.user.count();
  console.log('Users count:', count);
  const plans = await prisma.plan.findMany();
  console.log('Plans:', plans);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());