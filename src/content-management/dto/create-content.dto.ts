import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateContentQuestionDto } from './create-question.dto';

export enum ContentType {
  REGULAR = 'REGULAR',
  MISSION = 'MISSION',
  ASSIGNMENT = 'ASSIGNMENT',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateContentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsNotEmpty()
  @IsEnum(ContentType)
  type: ContentType;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  durationSec?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContentQuestionDto)
  questions?: CreateContentQuestionDto[];
}
