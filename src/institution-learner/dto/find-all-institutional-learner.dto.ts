import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InstitutionLearnerStatus } from '@prisma/client';

export class FindAllInstitutionLearnersDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  institutionId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  learnerId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  gradeId?: string;

  @IsOptional()
  @IsEnum(InstitutionLearnerStatus)
  status?: InstitutionLearnerStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}