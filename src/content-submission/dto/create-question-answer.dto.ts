import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateQuestionAnswerDto {
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @IsOptional()
  answer?: any;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsEarned?: number;
}
