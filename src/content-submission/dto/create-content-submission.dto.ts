import { SubmissionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateQuestionAnswerDto } from './create-question-answer.dto';

export class CreateContentSubmissionDto {
  @IsNotEmpty()
  @IsUUID()
  contentId: string;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalMarks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  correctCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  incorrectCount?: number;

  @IsOptional()
  startedAt?: Date;

  @IsOptional()
  submittedAt?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionAnswerDto)
  answers?: CreateQuestionAnswerDto[];
}
