import { InstitutionLearnerStatus } from '@prisma/client';

export class LearnerInvite {
  id: string;
  institutionId: string;
  learnerUsername: string;
  parentId: string;
  gradeId?: string | null;
  status: InstitutionLearnerStatus;
  expiresAt?: Date | null;
  acceptedAt?: Date | null;
  createdAt: Date;
}
