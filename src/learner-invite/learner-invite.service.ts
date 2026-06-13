import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLearnerInviteDto } from './dto/create-learner-invite.dto';
import { AcceptLearnerInviteDto } from './dto/accept-learner-invite.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { InstitutionLearnerStatus } from '@prisma/client';
import { LearnerInvite } from './entities/learner-invite.entity';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class LearnerInviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async createInvite(createDto: CreateLearnerInviteDto): Promise<LearnerInvite> {
    const invite = await this.prisma.learnerInvite.create({
      data: {
        ...createDto,
        status: InstitutionLearnerStatus.INVITED,
      },
      include: {
        institution: true,
        parent: { include: { user: true } },
      },
    });

    const parentUser = invite.parent?.user;
    const parentEmail = parentUser?.email;
    const parentName  = parentUser?.fullName ?? 'Parent';

    if (parentEmail) {
      await this.mail.sendLearnerInvite({
        toEmail: parentEmail,
        toName: parentName,
        institutionName: invite.institution.name,
        learnerUsername: invite.learnerUsername,
        inviteId: invite.id,
      });
    }

    return invite;
  }

  async getParentInvites(parentId: string): Promise<LearnerInvite[]> {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: parentId },
    });

    if (!parentProfile) {
      throw new NotFoundException('Parent profile not found');
    }

    return this.prisma.learnerInvite.findMany({
      where: { parentId: parentProfile.id, status: InstitutionLearnerStatus.INVITED },
      include: { institution: true, grade: true },
    });
  }

  async acceptInvite(inviteId: string, acceptDto: AcceptLearnerInviteDto) {
    const invite = await this.prisma.learnerInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.status !== InstitutionLearnerStatus.INVITED) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    const hashedPassword = await bcrypt.hash(acceptDto.password, 10);

    return this.prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          fullName: acceptDto.fullName,
          username: invite.learnerUsername,
          password: hashedPassword,
          role: UserRole.LEARNER,
        },
      });

      const learnerProfile = await tx.learnerProfile.create({
        data: {
          userId: user.id,
          parentId: invite.parentId,
          gradeId: invite.gradeId,
        },
      });

      await tx.institutionLearner.create({
        data: {
          institutionId: invite.institutionId,
          learnerId: learnerProfile.id,
          gradeId: invite.gradeId,
          status: InstitutionLearnerStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      await tx.learnerInvite.update({
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
    const invite = await this.prisma.learnerInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.status !== InstitutionLearnerStatus.INVITED) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    return this.prisma.learnerInvite.update({
      where: { id: inviteId },
      data: {
        status: InstitutionLearnerStatus.REJECTED,
      },
    });
  }
}
