import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice_cinema',
      displayName: 'Alice Cooper',
      password: hashedPassword,
      bio: 'Horror film enthusiast',
      isVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob_movies',
      displayName: 'Bob Director',
      password: hashedPassword,
      bio: 'Aspiring filmmaker',
      isVerified: true,
    },
  });

  console.log('Seed data created:', { user1, user2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
