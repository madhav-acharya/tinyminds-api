import { SubmissionStatus } from '@prisma/client';
import { IQuestionAnswer } from './question-answer.interface';

export interface IContentSubmission {
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
  answers?: IQuestionAnswer[];
}
