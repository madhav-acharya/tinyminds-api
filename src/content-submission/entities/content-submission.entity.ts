import { SubmissionStatus } from '@prisma/client';
import { QuestionAnswer } from './question-answer.entity';

export class ContentSubmission {
  id: string;
  contentId: string;
  learnerId: string;
  status: SubmissionStatus;
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  startedAt?: Date | null;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  answers?: QuestionAnswer[];
}
