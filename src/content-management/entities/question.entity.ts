import { QuestionType } from '../dto/create-question.dto';

export class ContentQuestionEntity {
  id: string;
  contentId: string;
  type: QuestionType;
  title: string;
  instruction: string;
  mediaUrl: string;
  animationUrl: string;
  points: number;
  sortOrder: number;
  config: any;
  answerKey: any;
  createdAt: Date;
  updatedAt: Date;
}
