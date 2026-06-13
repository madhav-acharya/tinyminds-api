import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTeacherInviteDto } from './dto/create-teacher-invite.dto';
import { AcceptTeacherInviteDto } from './dto/accept-teacher-invite.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { InstitutionLearnerStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TeacherInviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async createInvite(createDto: CreateTeacherInviteDto) {
    const invite = await this.prisma.teacherInvite.create({
      data: {
        ...createDto,
        status: InstitutionLearnerStatus.INVITED,
      },
      include: { institution: true },
    });

    await this.mail.sendTeacherInvite({
      toEmail: invite.email,
      toName: invite.fullName,
      institutionName: invite.institution.name,
      inviteId: invite.id,
    });

    return invite;
  }

  async acceptInvite(inviteId: string, acceptDto: AcceptTeacherInviteDto) {
    const invite = await this.prisma.teacherInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.status !== InstitutionLearnerStatus.INVITED) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existingUserByEmail) {
      throw new BadRequestException('A user with this email address is already registered.');
    }

    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username: acceptDto.username },
    });
    if (existingUserByUsername) {
      throw new BadRequestException('This username is already taken. Please choose a different one.');
    }

    const hashedPassword = await bcrypt.hash(acceptDto.password, 10);

    return this.prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          fullName: invite.fullName,
          email: invite.email,
          username: acceptDto.username,
          password: hashedPassword,
          role: UserRole.TEACHER,
        },
      });

      await tx.teacherProfile.create({
        data: {
          userId: user.id,
          institutionId: invite.institutionId,
        },
      });

      await tx.teacherInvite.update({
        where: { id: inviteId },
        data: {
          status: InstitutionLearnerStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      return user;
    });
  }

  async rejectInvite(inviteId: string) {
    const invite = await this.prisma.teacherInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.status !== InstitutionLearnerStatus.INVITED) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    return this.prisma.teacherInvite.update({
      where: { id: inviteId },
      data: {
        status: InstitutionLearnerStatus.REJECTED,
      },
    });
  }
}
