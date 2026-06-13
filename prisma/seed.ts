import { PrismaClient, UserRole, AccountStatus, ModuleScope, ContentType, ContentStatus, QuestionType, SubmissionStatus, InstitutionLearnerStatus } from '@prisma/client';
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

  const hashPassword = async (password: string) => await bcrypt.hash(password, 10);

  // 1. Create Owner
  const ownerPass = await hashPassword('owner123');
  const owner = await prisma.user.upsert({
    where: { email: 'owner@gmail.com' },
    update: { password: ownerPass },
    create: {
      email: 'owner@gmail.com',
      username: 'owner',
      fullName: 'Main Owner',
      password: ownerPass,
      role: UserRole.OWNER,
      ownerProfile: {
        create: {
          institutionId: institution.id,
        }
      }
    },
  });

  // 2. Create Teacher
  const teacherPass = await hashPassword('teacher123');
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@gmail.com' },
    update: { password: teacherPass },
    create: {
      email: 'teacher@gmail.com',
      username: 'teacher',
      fullName: 'Main Teacher',
      password: teacherPass,
      role: UserRole.TEACHER,
      teacherProfile: {
        create: {
          institutionId: institution.id,
        }
      }
    },
    include: { teacherProfile: true }
  });

  const teacherProfileId = teacher.teacherProfile!.id;

  // 3. Create Parent
  const parentPass = await hashPassword('parent123');
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@gmail.com' },
    update: { password: parentPass },
    create: {
      email: 'parent@gmail.com',
      username: 'parent',
      fullName: 'Main Parent',
      password: parentPass,
      role: UserRole.PARENT,
      parentProfile: {
        create: {}
      }
    },
    include: { parentProfile: true }
  });

  const parentProfileId = parentUser.parentProfile!.id;

  // 4. Create Learner (Kid)
  const kidUser = await prisma.user.upsert({
    where: { username: 'tinykid' },
    update: {},
    create: {
      username: 'tinykid',
      fullName: 'Tiny Kid',
      password: await hashPassword('kid123'),
      role: UserRole.LEARNER,
    }
  });

  const learnerProfile = await prisma.learnerProfile.upsert({
    where: { userId: kidUser.id },
    update: {},
    create: {
      userId: kidUser.id,
      parentId: parentProfileId,
    }
  });

  // 5. Link Learner to Institution
  const existingLink = await prisma.institutionLearner.findFirst({
    where: { institutionId: institution.id, learnerId: learnerProfile.id }
  });
  if (!existingLink) {
    await prisma.institutionLearner.create({
      data: {
        institutionId: institution.id,
        learnerId: learnerProfile.id,
        status: InstitutionLearnerStatus.ACCEPTED,
        acceptedAt: new Date(),
      }
    });
  }

  // 6. Create Module, Content, Questions
  let mod = await prisma.module.findFirst({ where: { title: 'Math Fundamentals', institutionId: institution.id } });
  if (!mod) {
    mod = await prisma.module.create({
      data: {
        institutionId: institution.id,
        title: 'Math Fundamentals',
        scope: ModuleScope.INSTITUTION,
        isPublished: true,
      }
    });
  }

  let content = await prisma.content.findFirst({ where: { title: 'Addition Basics', moduleId: mod.id } });
  if (!content) {
    content = await prisma.content.create({
      data: {
        moduleId: mod.id,
        teacherId: teacherProfileId,
        title: 'Addition Basics',
        type: ContentType.MISSION,
        status: ContentStatus.PUBLISHED,
      }
    });

    const question1 = await prisma.contentQuestion.create({
      data: {
        contentId: content.id,
        type: QuestionType.SINGLE_CHOICE,
        title: 'What is 2 + 2?',
        points: 10,
      }
    });

    const question2 = await prisma.contentQuestion.create({
      data: {
        contentId: content.id,
        type: QuestionType.IMAGE_TAP,
        title: 'Tap the number 4',
        points: 10,
      }
    });

    // 7. Add Analytics (Submissions & Answers)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const submission = await prisma.contentSubmission.create({
      data: {
        contentId: content.id,
        learnerId: learnerProfile.id,
        status: SubmissionStatus.PASSED,
        score: 20,
        totalMarks: 20,
        correctCount: 2,
        incorrectCount: 0,
        startedAt: pastDate,
        submittedAt: pastDate,
      }
    });

    await prisma.questionAnswer.createMany({
      data: [
        {
          submissionId: submission.id,
          questionId: question1.id,
          learnerId: learnerProfile.id,
          isCorrect: true,
          pointsEarned: 10,
          answeredAt: pastDate,
        },
        {
          submissionId: submission.id,
          questionId: question2.id,
          learnerId: learnerProfile.id,
          isCorrect: true,
          pointsEarned: 10,
          answeredAt: pastDate,
        }
      ]
    });
  }

  console.log('Seed completed successfully. You can login with owner@gmail.com, parent@gmail.com, or teacher@gmail.com.');
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
