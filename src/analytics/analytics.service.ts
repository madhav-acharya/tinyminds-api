import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLearnerInterests(learnerId: string, userId: string) {
    const learner = await this.prisma.learnerProfile.findUnique({
      where: { id: learnerId },
      include: { parent: true, institutions: true },
    });

    if (!learner) {
      throw new NotFoundException('Learner not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacherProfile: true,
        adminProfile: true,
        ownerProfile: true,
      },
    });

    const isParent = learner.parent.userId === userId;
    const userInstitutionIds = [
      user?.teacherProfile?.institutionId,
      user?.adminProfile?.institutionId,
      user?.ownerProfile?.institutionId,
    ].filter(Boolean);

    const isInstitutionStaff = learner.institutions.some(inst => userInstitutionIds.includes(inst.institutionId));

    if (!isParent && !isInstitutionStaff && user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('You do not have access to this learner');
    }

    const byModuleRaw: any[] = await this.prisma.$queryRaw`
      SELECT 
        m.title as "module",
        COUNT(qa.id) as attempts,
        COALESCE(SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(qa.id), 0), 0) as accuracy,
        COALESCE(AVG(qa.points_earned), 0) as "avgPoints"
      FROM content.question_answers qa
      JOIN content.content_questions cq ON qa.question_id = cq.id
      JOIN content.contents c ON cq.content_id = c.id
      JOIN learning.modules m ON c.module_id = m.id
      WHERE qa.learner_id = ${learnerId}
      GROUP BY m.title
    `;

    const byQuestionTypeRaw: any[] = await this.prisma.$queryRaw`
      SELECT 
        cq.type,
        COUNT(qa.id) as attempts,
        COALESCE(SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(qa.id), 0), 0) as accuracy
      FROM content.question_answers qa
      JOIN content.content_questions cq ON qa.question_id = cq.id
      WHERE qa.learner_id = ${learnerId}
      GROUP BY cq.type
    `;

    const byContentTypeRaw: any[] = await this.prisma.$queryRaw`
      SELECT 
        c.type,
        COUNT(cs.id) as completions
      FROM content.content_submissions cs
      JOIN content.contents c ON cs.content_id = c.id
      WHERE cs.learner_id = ${learnerId}
        AND cs.status IN ('SUBMITTED', 'PASSED')
      GROUP BY c.type
    `;

    const overTimeRaw: any[] = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', qa.answered_at) as "date",
        COUNT(qa.id) as count
      FROM content.question_answers qa
      WHERE qa.learner_id = ${learnerId}
      GROUP BY DATE_TRUNC('day', qa.answered_at)
      ORDER BY DATE_TRUNC('day', qa.answered_at) ASC
    `;

    const convertBigInt = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === 'bigint') {
          obj[key] = Number(obj[key]);
        }
      }
      return obj;
    };

    return {
      byModule: byModuleRaw.map(convertBigInt),
      byQuestionType: byQuestionTypeRaw.map(convertBigInt),
      byContentType: byContentTypeRaw.map(convertBigInt),
      overTime: overTimeRaw.map(convertBigInt),
    };
  }
}
