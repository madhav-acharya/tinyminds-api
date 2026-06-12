import { InstitutionLearnerStatus } from '@prisma/client';

export interface IInstitutionLearner {
  id: string;
  institutionId: string;
  learnerId: string;
  gradeId?: string | null;
  status: InstitutionLearnerStatus;
  acceptedAt?: Date | null;
  createdAt: Date;
}
