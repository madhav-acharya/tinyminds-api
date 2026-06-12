import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateInstitutionLearnerDto } from './dto/create-institution-learner.dto';
import { UpdateInstitutionLearnerDto } from './dto/update-institution-learner.dto';
import { FindAllInstitutionLearnersDto } from './dto/find-all-institutional-learner.dto';
import { InstitutionLearner } from './entities/institution-learner.entity';

@Injectable()
export class InstitutionLearnerService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInstitutionLearnerDto): Promise<InstitutionLearner> {
    return this.prisma.institutionLearner.create({
      data: {
        institutionId: dto.institutionId,
        learnerId: dto.learnerId,
        gradeId: dto.gradeId,
        status: dto.status,
      },
    });
  }

  async findAll(query: FindAllInstitutionLearnersDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = {
      institutionId: query.institutionId,
      learnerId: query.learnerId,
      gradeId: query.gradeId,
      status: query.status,
    };

    if (query.search) {
      where.learner = {
        user: {
          fullName: { contains: query.search, mode: 'insensitive' },
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.institutionLearner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          institution: true,
          learner: {
            include: {
              user: true,
            },
          },
          grade: true,
        },
      }),
      this.prisma.institutionLearner.count({ where }),
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

  async findOne(id: string): Promise<InstitutionLearner> {
    const record = await this.prisma.institutionLearner.findUnique({
      where: { id },
      include: {
        institution: true,
        learner: true,
        grade: true,
      },
    });

    if (!record) throw new NotFoundException('InstitutionLearner not found');
    return record;
  }

  async update(id: string, dto: UpdateInstitutionLearnerDto) {
    await this.findOne(id);

    return this.prisma.institutionLearner.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.institutionLearner.delete({
      where: { id },
    });
  }
}