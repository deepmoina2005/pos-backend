import { prisma } from '../src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const email = "admin@pos.com";
  const password = "12345678";
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      fullName: 'Super Admin',
    },
    create: {
      email,
      password: hashedPassword,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Super Admin user created/updated:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
