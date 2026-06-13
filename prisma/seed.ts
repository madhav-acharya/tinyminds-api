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
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@tinyminds.com';
  const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
  const superAdminFullName = process.env.SUPER_ADMIN_FULL_NAME || 'Super Admin';

  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@tinyminds.com';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminFullName = process.env.ADMIN_FULL_NAME || 'Institution Admin';

  const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  console.log('Seeding data...');

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      username: superAdminUsername,
      fullName: superAdminFullName,
      password: hashedSuperAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });
  console.log(`Super admin with this email ${superAdminEmail} added`);

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
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: adminUsername,
      fullName: adminFullName,
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Admin with this email ${adminEmail} added`);

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
