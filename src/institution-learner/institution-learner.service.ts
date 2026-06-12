import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateInstitutionLearnerDto } from './dto/create-institution-learner.dto';
import { UpdateInstitutionLearnerDto } from './dto/update-institution-learner.dto';
import { FindAllInstitutionLearnersDto } from './dto/find-all-institutional-learner.dto';

@Injectable()
export class InstitutionLearnerService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInstitutionLearnerDto) {
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

    return this.prisma.institutionLearner.findMany({
      where: {
        institutionId: query.institutionId,
        learnerId: query.learnerId,
        gradeId: query.gradeId,
        status: query.status,
      },
      skip,
      take: limit,
      include: {
        institution: true,
        learner: true,
        grade: true,
      },
    });
  }

  async findOne(id: string) {
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