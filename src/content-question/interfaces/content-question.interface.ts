import { QuestionType } from '@prisma/client';
import { IQuestionOption } from './question-option.interface';

export interface IContentQuestion {
  id: string;
  contentId: string;
  type: QuestionType;
  title: string;
  instruction?: string | null;
  mediaUrl?: string | null;
  animationUrl?: string | null;
  points: number;
  sortOrder: number;
  config?: any;
  answerKey?: any;
  createdAt: Date;
  updatedAt: Date;
  options?: IQuestionOption[];
}
