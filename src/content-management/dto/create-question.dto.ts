import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  IMAGE_TAP = 'IMAGE_TAP',
  ANIMATION_TAP = 'ANIMATION_TAP',
  TRUE_FALSE = 'TRUE_FALSE',
  TEXT_INPUT = 'TEXT_INPUT',
  FILL_BLANK = 'FILL_BLANK',
  MATCHING = 'MATCHING',
  ORDERING = 'ORDERING',
  AUDIO_CHOICE = 'AUDIO_CHOICE',
  VIDEO_CHOICE = 'VIDEO_CHOICE',
}

export class CreateQuestionOptionDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsNotEmpty()
  isCorrect: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}

export class CreateContentQuestionDto {
  @IsOptional()
  @IsUUID()
  contentId?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsNotEmpty()
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  animationUrl?: string;

  @IsOptional()
  config?: any;

  @IsOptional()
  answerKey?: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}
