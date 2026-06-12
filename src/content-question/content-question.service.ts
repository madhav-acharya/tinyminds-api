import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';
import { CreateContentQuestionDto } from './dto/create-content-question.dto';
import { UpdateContentQuestionDto } from './dto/update-content-question.dto';
import { FindAllContentQuestionDto } from './dto/find-all-content-question.dto';
import { ContentQuestion } from './entities/content-question.entity';

@Injectable()
export class ContentQuestionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContentQuestionDto: CreateContentQuestionDto): Promise<ContentQuestion> {
    const { options, ...questionData } = createContentQuestionDto;
    return this.prisma.contentQuestion.create({
      data: {
        ...questionData,
        options: options
          ? {
              create: options,
            }
          : undefined,
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findAll(query: FindAllContentQuestionDto): Promise<PaginatedResponse<ContentQuestion>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search, contentId, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (contentId) {
      where.contentId = contentId;
    }

    if (type) {
      where.type = type;
    }

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

  async findOne(id: string): Promise<ContentQuestion> {
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

  async update(id: string, updateContentQuestionDto: UpdateContentQuestionDto): Promise<ContentQuestion> {
    await this.findOne(id);
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
          options: options
            ? {
                create: options,
              }
            : undefined,
        },
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.contentQuestion.delete({
      where: { id },
    });
  }
}
