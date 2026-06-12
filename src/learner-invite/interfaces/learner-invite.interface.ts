import { InstitutionLearnerStatus } from '@prisma/client';

export interface ILearnerInvite {
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
