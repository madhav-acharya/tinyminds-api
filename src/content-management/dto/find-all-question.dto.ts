import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { QuestionType } from './create-question.dto';

export class FindAllContentQuestionDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  contentId?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;
}
