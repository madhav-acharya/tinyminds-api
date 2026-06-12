export class QuestionOption {
  id: string;
  questionId: string;
  text?: string | null;
  mediaUrl?: string | null;
  isCorrect: boolean;
  sortOrder: number;
}
