import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'adminpassword';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';

  const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  console.log('Seeding data...');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@tinyminds.com' },
    update: {},
    create: {
      email: 'superadmin@tinyminds.com',
      username: 'superadmin',
      fullName: 'Super Admin',
      password: hashedSuperAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: {
      userId: superAdmin.id,
    },
  });

  const institution = await prisma.institution.upsert({
    where: { code: 'DEF-001' },
    update: {},
    create: {
      name: 'Default Institution',
      code: 'DEF-001',
      status: 'ACTIVE',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tinyminds.com' },
    update: {},
    create: {
      email: 'admin@tinyminds.com',
      username: 'admin',
      fullName: 'Institution Admin',
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      institutionId: institution.id,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
