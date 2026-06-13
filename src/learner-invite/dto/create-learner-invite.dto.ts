import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLearnerInviteDto {
  @IsNotEmpty()
  @IsString()
  institutionId: string;

  @IsNotEmpty()
  @IsString()
  learnerUsername: string;

  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  expiresAt?: Date;
}
