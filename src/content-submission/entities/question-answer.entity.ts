export class QuestionAnswer {
  id: string;
  submissionId: string;
  questionId: string;
  learnerId: string;
  answer?: any;
  isCorrect: boolean;
  pointsEarned: number;
  answeredAt: Date;
}
