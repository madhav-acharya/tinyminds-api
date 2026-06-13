import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { FindAllContentDto } from './dto/find-all-content.dto';
import { CreateContentQuestionDto } from './dto/create-question.dto';
import { UpdateContentQuestionDto } from './dto/update-question.dto';
import { FindAllContentQuestionDto } from './dto/find-all-question.dto';

@Injectable()
export class ContentManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // Content Methods
  async createContent(createContentDto: CreateContentDto) {
    const { questions, ...contentData } = createContentDto;
    return this.prisma.content.create({
      data: {
        ...(contentData as any),
        questions: questions
          ? {
              create: questions.map((q) => ({
                ...q,
                options: q.options ? { create: q.options } : undefined,
              })),
            }
          : undefined,
      } as any,
      include: {
        questions: {
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findAllContent(query: FindAllContentDto): Promise<PaginatedResponse<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search, moduleId, teacherId, type, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (moduleId) where.moduleId = moduleId;
    if (teacherId) where.teacherId = teacherId;
    if (type) where.type = type;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.content.count({ where }),
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          module: { select: { id: true, title: true } },
          teacher: {
            select: {
              id: true,
              user: { select: { id: true, fullName: true } },
            },
          },
          _count: { select: { questions: true, submissions: true } },
        },
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

  async findOneContent(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        module: { select: { id: true, title: true } },
        teacher: {
          select: {
            id: true,
            user: { select: { id: true, fullName: true } },
          },
        },
        questions: {
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { questions: true, submissions: true } },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  async updateContent(id: string, updateContentDto: UpdateContentDto) {
    await this.findOneContent(id);
    const { questions, ...contentData } = updateContentDto;

    return this.prisma.$transaction(async (tx: any) => {
      if (questions) {
        await tx.contentQuestion.deleteMany({
          where: { contentId: id },
        });
      }

      return tx.content.update({
        where: { id },
        data: {
          ...(contentData as any),
          questions: questions
            ? {
                create: questions.map((q) => ({
                  ...q,
                  options: q.options ? { create: q.options } : undefined,
                })),
              }
            : undefined,
        } as any,
        include: {
          questions: {
            include: {
              options: { orderBy: { sortOrder: 'asc' } },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });
  }

  async removeContent(id: string) {
    await this.findOneContent(id);
    return this.prisma.content.delete({
      where: { id },
    });
  }

  // Question Methods
  async createQuestion(createContentQuestionDto: CreateContentQuestionDto) {
    const { options, ...questionData } = createContentQuestionDto;
    return this.prisma.contentQuestion.create({
      data: {
        ...questionData,
        options: options ? { create: options } : undefined,
      } as any,
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findAllQuestions(query: FindAllContentQuestionDto): Promise<PaginatedResponse<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search, contentId, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (contentId) where.contentId = contentId;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { instruction: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.contentQuestion.count({ where }),
      this.prisma.contentQuestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          content: { select: { id: true, title: true } },
          options: { orderBy: { sortOrder: 'asc' } },
        },
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

  async findOneQuestion(id: string) {
    const question = await this.prisma.contentQuestion.findUnique({
      where: { id },
      include: {
        content: { select: { id: true, title: true } },
        options: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!question) {
      throw new NotFoundException(`Content Question with ID ${id} not found`);
    }

    return question;
  }

  async updateQuestion(id: string, updateContentQuestionDto: UpdateContentQuestionDto) {
    await this.findOneQuestion(id);
    const { options, ...questionData } = updateContentQuestionDto;

    return this.prisma.$transaction(async (tx: any) => {
      if (options) {
        await tx.questionOption.deleteMany({
          where: { questionId: id },
        });
      }

      return tx.contentQuestion.update({
        where: { id },
        data: {
          ...questionData,
          options: options ? { create: options } : undefined,
        } as any,
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  async removeQuestion(id: string) {
    await this.findOneQuestion(id);
    return this.prisma.contentQuestion.delete({
      where: { id },
    });
  }
}
