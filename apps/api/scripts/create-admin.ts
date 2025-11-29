import prisma from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'admin@jacal.com';
  const password = 'admin123';
  const name = 'Admin User';

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`User ${email} already exists.`);
    if (!existingUser.isAdmin) {
      await prisma.user.update({
        where: { email },
        data: { isAdmin: true },
      });
      console.log(`Updated ${email} to be an admin.`);
    } else {
      console.log(`${email} is already an admin.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        isAdmin: true,
      },
    });
    console.log(`Created admin user: ${email} / ${password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
