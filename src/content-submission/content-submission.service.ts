import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateContentSubmissionDto } from './dto/create-content-submission.dto';
import { UpdateContentSubmissionDto } from './dto/update-content-submission.dto';
import { FindAllSubmissionsDto } from './dto/find-all-submissions.dto';
import { ContentSubmission } from './entities/content-submission.entity';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';

@Injectable()
export class ContentSubmissionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContentSubmissionDto, userId: string): Promise<ContentSubmission> {
    const { answers, ...submissionData } = dto;

    return this.prisma.$transaction(async (tx: any) => {
      const learnerProfile = await tx.learnerProfile.findUnique({
        where: { userId },
      });

      if (!learnerProfile) {
        throw new NotFoundException('Learner profile not found');
      }

      const submission = await tx.contentSubmission.create({
        data: {
          ...submissionData,
          learnerId: learnerProfile.id,
        },
      });

      if (answers && answers.length > 0) {
        await tx.questionAnswer.createMany({
          data: answers.map((answer) => ({
            ...answer,
            submissionId: submission.id,
            learnerId: learnerProfile.id,
          })),
        });
      }

      return tx.contentSubmission.findUnique({
        where: { id: submission.id },
        include: { answers: true },
      });
    });
  }

  async findAll(query: FindAllSubmissionsDto): Promise<PaginatedResponse<ContentSubmission>> {
    const { page = 1, limit = 10, contentId, learnerId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (contentId) where.contentId = contentId;
    if (learnerId) where.learnerId = learnerId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.contentSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          content: { select: { id: true, title: true } },
          learner: { select: { id: true, user: { select: { fullName: true } } } },
        },
      }),
      this.prisma.contentSubmission.count({ where }),
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

  async findOne(id: string): Promise<ContentSubmission> {
    const submission = await this.prisma.contentSubmission.findUnique({
      where: { id },
      include: {
        content: {
          include: {
            module: true,
            questions: {
              include: {
                options: { orderBy: { sortOrder: 'asc' } },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        learner: { include: { user: { select: { fullName: true } } } },
        answers: { include: { question: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Content Submission with ID ${id} not found`);
    }

    return submission;
  }

  async update(id: string, dto: UpdateContentSubmissionDto): Promise<ContentSubmission> {
    const existing = await this.findOne(id);
    const { answers, ...submissionData } = dto;

    return this.prisma.$transaction(async (tx: any) => {
      if (answers && answers.length > 0) {
        await tx.questionAnswer.deleteMany({
          where: { submissionId: id },
        });

        await tx.questionAnswer.createMany({
          data: answers.map((answer) => ({
            ...answer,
            submissionId: id,
            learnerId: existing.learnerId,
          })),
        });
      }

      return tx.contentSubmission.update({
        where: { id },
        data: submissionData,
        include: { answers: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contentSubmission.delete({
      where: { id },
    });
  }
}
