import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { PrismaService } from '../prisma.service';
import { FindAllInstitutionDto } from './dto/find-all-institution.dto';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';

@Injectable()
export class InstitutionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInstitutionDto: CreateInstitutionDto) {
    return this.prisma.institution.create({
      data: createInstitutionDto,
    });
  }

  async findAll(query: FindAllInstitutionDto): Promise<PaginatedResponse<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.institution.count({ where }),
      this.prisma.institution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    }

    return institution;
  }

  async update(id: string, updateInstitutionDto: UpdateInstitutionDto) {
    await this.findOne(id);

    return this.prisma.institution.update({
      where: { id },
      data: updateInstitutionDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.institution.delete({
      where: { id },
    });
  }

  async getDashboardStats(institutionId: string) {
    const [
      teacherCount,
      teachers,
      learnerEnrollments,
      grades,
      submissionStats,
    ] = await Promise.all([
      this.prisma.teacherProfile.count({ where: { institutionId } }),
      this.prisma.teacherProfile.findMany({
        where: { institutionId },
        include: { user: { select: { id: true, fullName: true, email: true, status: true, createdAt: true } } },
        orderBy: { user: { fullName: 'asc' } },
      }),
      this.prisma.institutionLearner.findMany({
        where: { institutionId },
        include: {
          learner: {
            include: {
              user: { select: { id: true, fullName: true, email: true, username: true, status: true, createdAt: true } },
              grade: { select: { id: true, name: true } },
            },
          },
          grade: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.grade.findMany({
        where: { institutionId },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { institutionLearners: { where: { institutionId } } } },
        },
      }),
      this.prisma.contentSubmission.findMany({
        where: {
          learner: {
            institutions: { some: { institutionId } },
          },
        },
        select: { score: true, totalMarks: true, status: true },
      }),
    ]);

    const totalLearners = learnerEnrollments.length;
    const totalSubmissions = submissionStats.length;
    const passedSubmissions = submissionStats.filter(
      (s) => s.status === 'PASSED',
    ).length;
    const avgScore =
      totalSubmissions > 0
        ? Math.round(
            (submissionStats.reduce(
              (sum, s) => sum + (s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0),
              0,
            ) / totalSubmissions) * 10) / 10
        : 0;
    const passRate =
      totalSubmissions > 0
        ? Math.round((passedSubmissions / totalSubmissions) * 100)
        : 0;

    return {
      teacherCount,
      learnerCount: totalLearners,
      gradeCount: grades.length,
      teachers: teachers.map((t) => ({
        id: t.id,
        userId: t.userId,
        fullName: t.user.fullName,
        email: t.user.email,
        status: t.user.status,
        joinedAt: t.user.createdAt,
      })),
      learners: learnerEnrollments.map((il) => ({
        enrollmentId: il.id,
        learnerId: il.learnerId,
        status: il.status,
        enrolledAt: il.createdAt,
        fullName: il.learner.user.fullName,
        username: il.learner.user.username,
        email: il.learner.user.email,
        userStatus: il.learner.user.status,
        grade: il.grade ?? il.learner.grade,
      })),
      grades: grades.map((g) => ({
        id: g.id,
        name: g.name,
        sortOrder: g.sortOrder,
        learnerCount: g._count.institutionLearners,
      })),
      analytics: {
        totalSubmissions,
        passedSubmissions,
        avgScore,
        passRate,
        totalLearners,
        totalTeachers: teacherCount,
        totalGrades: grades.length,
      },
    };
  }
}
