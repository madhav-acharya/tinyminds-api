import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateTeacherInviteDto {
  @IsNotEmpty()
  @IsString()
  institutionId: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;
}
