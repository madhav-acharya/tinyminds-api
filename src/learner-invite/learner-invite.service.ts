import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLearnerInviteDto } from './dto/create-learner-invite.dto';

import { UserRole } from '../common/enums/user-role.enum';
import { InstitutionLearnerStatus } from '@prisma/client';
import { LearnerInvite } from './entities/learner-invite.entity';

import { MailService } from '../mail/mail.service';

@Injectable()
export class LearnerInviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async createInvite(createDto: CreateLearnerInviteDto): Promise<LearnerInvite> {
    // Look up the learner by username
    const learnerUser = await this.prisma.user.findFirst({
      where: { username: createDto.learnerUsername, role: UserRole.LEARNER },
      include: { learnerProfile: { include: { parent: { include: { user: true } } } } },
    });

    if (!learnerUser || !learnerUser.learnerProfile) {
      throw new NotFoundException(`No learner account found with username: ${createDto.learnerUsername}`);
    }

    const parentProfile = learnerUser.learnerProfile.parent;

    const invite = await this.prisma.learnerInvite.create({
      data: {
        institutionId: createDto.institutionId,
        learnerUsername: createDto.learnerUsername,
        parentId: parentProfile.id,
        gradeId: createDto.gradeId,
        expiresAt: createDto.expiresAt,
        status: InstitutionLearnerStatus.INVITED,
      },
      include: {
        institution: true,
        parent: { include: { user: true } },
      },
    });

    const parentEmail = parentProfile.user?.email;
    const parentName  = parentProfile.user?.fullName ?? 'Parent';

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

  async acceptInvite(inviteId: string) {
    const invite = await this.prisma.learnerInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.status !== InstitutionLearnerStatus.INVITED) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    // Find the learner profile associated with the invite
    const learnerUser = await this.prisma.user.findFirst({
      where: { username: invite.learnerUsername, role: UserRole.LEARNER },
      include: { learnerProfile: true },
    });

    if (!learnerUser || !learnerUser.learnerProfile) {
      throw new NotFoundException('Learner profile not found for this invitation');
    }

    const learnerProfileId = learnerUser.learnerProfile.id;

    return this.prisma.$transaction(async (tx: any) => {
      await tx.institutionLearner.create({
        data: {
          institutionId: invite.institutionId,
          learnerId: learnerProfileId,
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

      return learnerUser;
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
