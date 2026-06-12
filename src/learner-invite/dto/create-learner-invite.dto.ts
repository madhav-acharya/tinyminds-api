import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLearnerInviteDto {
  @IsNotEmpty()
  @IsString()
  institutionId: string;

  @IsNotEmpty()
  @IsString()
  learnerUsername: string;

  @IsNotEmpty()
  @IsString()
  parentId: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  expiresAt?: Date;
}
