import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_BLANKS = 'FILL_IN_BLANKS',
}

export class CreateQuestionOptionDto {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  isCorrect: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateContentQuestionDto {
  @IsNotEmpty()
  @IsUUID()
  contentId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsNotEmpty()
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsNotEmpty()
  @IsNumber()
  sortOrder: number;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}

export class UpdateContentQuestionDto {
  @IsOptional()
  @IsUUID()
  contentId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}

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
