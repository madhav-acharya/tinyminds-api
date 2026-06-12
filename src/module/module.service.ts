import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { FindAllModuleDto } from './dto/find-all-module.dto';

@Injectable()
export class ModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createModuleDto: CreateModuleDto) {
    return this.prisma.module.create({
      data: createModuleDto,
    });
  }

  async findAll(query: FindAllModuleDto): Promise<PaginatedResponse<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search, institutionId, gradeId, scope, isPublished } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (gradeId) {
      where.gradeId = gradeId;
    }

    if (scope) {
      where.scope = scope;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.module.count({ where }),
      this.prisma.module.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          institution: { select: { id: true, name: true } },
          grade: { select: { id: true, name: true } },
          _count: { select: { contents: true } },
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
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        institution: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } },
        _count: { select: { contents: true } },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    return module;
  }

  async update(id: string, updateModuleDto: UpdateModuleDto) {
    await this.findOne(id);

    return this.prisma.module.update({
      where: { id },
      data: updateModuleDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.module.delete({
      where: { id },
    });
  }
}
