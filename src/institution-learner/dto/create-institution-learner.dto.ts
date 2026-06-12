import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { InstitutionLearnerStatus } from '@prisma/client';

export class CreateInstitutionLearnerDto {
  @IsString()
  @IsUUID()
  institutionId: string;

  @IsString()
  @IsUUID()
  learnerId: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  gradeId?: string;

  @IsOptional()
  @IsEnum(InstitutionLearnerStatus)
  status?: InstitutionLearnerStatus;
}