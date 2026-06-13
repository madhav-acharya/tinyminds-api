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
      learnerProfile: {
        include: {
          parent: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
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

    let gradeId: string | undefined = undefined;
    if (dto.grade?.trim()) {
      const gradeName = dto.grade.trim();
      let grade = await this.prisma.grade.findFirst({
        where: {
          name: { equals: gradeName, mode: 'insensitive' },
          institutionId: null,
        },
      });
      if (!grade) {
        grade = await this.prisma.grade.create({
          data: { name: gradeName, institutionId: null },
        });
      }
      gradeId = grade.id;
    }

    const child = await this.create({
      fullName: dto.fullName,
      username: dto.username,
      email: dto.email,
      password: dto.password,
      role: UserRole.LEARNER,
      parentId: parentProfile.id,
      gradeId,
    });

    const learnerProfile = await this.prisma.learnerProfile.findUnique({
      where: { userId: child.id },
      include: { grade: true },
    });

    if (!learnerProfile) {
      throw new BadRequestException('Failed to create learner profile');
    }

    return {
      id: learnerProfile.id,
      name: child.fullName,
      grade: learnerProfile.grade?.name || 'Learner',
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

  async findSwitchTargetForUser(activeUserId: string, targetRole: UserRole, learnerProfileId?: string) {
    if (targetRole === UserRole.LEARNER) {
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId: activeUserId },
      });

      if (!parentProfile) {
        throw new BadRequestException('Only parent accounts can switch to learner view');
      }

      const learnerProfile = await this.prisma.learnerProfile.findFirst({
        where: {
          parentId: parentProfile.id,
          ...(learnerProfileId ? { id: learnerProfileId } : {}),
        },
        include: { user: true },
        orderBy: { user: { createdAt: 'desc' } },
      });

      if (!learnerProfile?.user) {
        throw new BadRequestException('No learner profile found for this parent');
      }

      return learnerProfile.user;
    }

    if (targetRole === UserRole.PARENT) {
      const learnerProfile = await this.prisma.learnerProfile.findUnique({
        where: { userId: activeUserId },
        include: {
          parent: {
            include: { user: true },
          },
        },
      });

      if (!learnerProfile?.parent?.user) {
        throw new BadRequestException('Only learner accounts can switch to parent view');
      }

      return learnerProfile.parent.user;
    }

    throw new BadRequestException('Unsupported target role for profile switching');
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true,
        teacherProfile: true,
        parentProfile: true,
        learnerProfile: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
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
