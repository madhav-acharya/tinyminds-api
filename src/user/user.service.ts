import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-user.dto';
import { PrismaService } from '../prisma.service';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { institutionId, parentId, gradeId, isPublic, ...userData } = createUserDto;

    return this.prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: userData,
      });

      if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
        await tx.adminProfile.create({
          data: { userId: user.id, institutionId },
        });
      } else if (user.role === UserRole.TEACHER) {
        if (!institutionId) {
          throw new BadRequestException('Teacher must have an institutionId');
        }
        await tx.teacherProfile.create({
          data: { userId: user.id, institutionId },
        });
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

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
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

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
