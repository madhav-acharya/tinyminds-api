import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-user.dto';
import { PrismaService } from '../prisma.service';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';
import type { Request } from 'express';
import { CreateParentChildDto } from './dto/create-parent-child.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { institutionId, parentId, gradeId, isPublic, institution: institutionData, ...userData } = createUserDto;

    return this.prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: userData as any,
      });

      if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
        await tx.adminProfile.create({
          data: { userId: user.id, institutionId },
        });
      } else if (user.role === UserRole.TEACHER) {
        if (institutionId) {
          await tx.teacherProfile.create({
            data: { userId: user.id, institutionId },
          });
        }
      } else if (user.role === UserRole.PARENT) {
        await tx.parentProfile.create({
          data: { userId: user.id },
        });
      } else if (user.role === UserRole.LEARNER) {
        if (!parentId) {
          throw new BadRequestException('Learner must have a parentId');
        }
        await tx.learnerProfile.create({
          data: { userId: user.id, parentId, gradeId, isPublic: isPublic ?? true },
        });
      } else if (user.role === UserRole.OWNER) {
        let actualInstitutionId = institutionId;

        if (institutionData) {
          const newInstitution = await tx.institution.create({
            data: institutionData,
          });
          actualInstitutionId = newInstitution.id;
        }

        if (!actualInstitutionId) {
          throw new BadRequestException('Owner must have an institutionId or institution details');
        }

        await tx.ownerProfile.create({
          data: { 
            userId: user.id, 
            institutionId: actualInstitutionId 
          },
        });
      }

      return user;
    });
  }

  async findAll(query: FindAllUsersDto): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const include: Prisma.UserInclude = {
      adminProfile: true,
      teacherProfile: true,
      parentProfile: true,
      learnerProfile: true,
      ownerProfile: true,
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
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

  async findByUsernameOrEmail(usernameOrEmail: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      },
    });
  }

  async createChild(request: Request, dto: CreateParentChildDto) {
    const activeUser = request['user'] as { sub: string };
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: activeUser.sub },
    });

    if (!parentProfile) {
      throw new BadRequestException('Parent profile not found');
    }

    const childHandle = dto.fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 16) || 'child';
    const tempUsername = `${childHandle}-${randomBytes(3).toString('hex')}`;
    const tempPassword = randomBytes(12).toString('hex');

    const child = await this.create({
      fullName: dto.fullName,
      username: tempUsername,
      password: tempPassword,
      role: UserRole.LEARNER,
      parentId: parentProfile.id,
    });

    return {
      id: child.id,
      name: child.fullName,
      grade: dto.grade?.trim() || 'Learner',
      progress: 0,
      streak: 0,
      nextGoal: dto.nextGoal?.trim() || 'Set a learning goal',
    };
  }

  async findChildrenForParent(request: Request) {
    const activeUser = request['user'] as { sub: string };
    const children = await this.prisma.learnerProfile.findMany({
      where: {
        parent: {
          userId: activeUser.sub,
        },
      },
      include: {
        user: true,
        grade: true,
      },
      orderBy: { user: { createdAt: 'desc' } },
    });

    return children.map((child) => ({
      id: child.id,
      name: child.user.fullName,
      grade: child.grade?.name || 'Learner',
      progress: 0,
      streak: 0,
      nextGoal: 'Set a learning goal',
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true,
        teacherProfile: true,
        parentProfile: true,
        learnerProfile: true,
        ownerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
