import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { FindAllGradeDto } from './dto/find-all-grade.dto';

@Injectable()
export class GradeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGradeDto: CreateGradeDto) {
    return this.prisma.grade.create({
      data: createGradeDto,
    });
  }

  async findAll(query: FindAllGradeDto): Promise<PaginatedResponse<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search, institutionId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [total, data] = await Promise.all([
      this.prisma.grade.count({ where }),
      this.prisma.grade.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: { institution: { select: { id: true, name: true } } },
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
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: { institution: { select: { id: true, name: true } } },
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    return grade;
  }

  async update(id: string, updateGradeDto: UpdateGradeDto) {
    await this.findOne(id);

    return this.prisma.grade.update({
      where: { id },
      data: updateGradeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.grade.delete({
      where: { id },
    });
  }
}
