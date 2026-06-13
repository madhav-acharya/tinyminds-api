import { IsOptional, IsString, IsEnum, IsUUID, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateContentQuestionDto } from './create-question.dto';
import { ContentType, ContentStatus } from './create-content.dto';

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

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

  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsUUID()
  moduleId?: string;

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
