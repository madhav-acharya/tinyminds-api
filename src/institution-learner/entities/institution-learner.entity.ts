import { InstitutionLearnerStatus } from '@prisma/client';

export class InstitutionLearner {
  id: string;
  institutionId: string;
  learnerId: string;
  gradeId?: string | null;
  status: InstitutionLearnerStatus;
  acceptedAt?: Date | null;
  createdAt: Date;
}