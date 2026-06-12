import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { FindAllContentDto } from './dto/find-all-content.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContentDto: CreateContentDto) {
    return this.prisma.content.create({
      data: createContentDto,
    });
  }

  async findAll(query: FindAllContentDto): Promise<PaginatedResponse<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search, moduleId, teacherId, type, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (moduleId) {
      where.moduleId = moduleId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

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

  async findOne(id: string) {
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
        _count: { select: { questions: true, submissions: true } },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  async update(id: string, updateContentDto: UpdateContentDto) {
    await this.findOne(id);

    return this.prisma.content.update({
      where: { id },
      data: updateContentDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.content.delete({
      where: { id },
    });
  }
}
