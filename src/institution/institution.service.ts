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
}
