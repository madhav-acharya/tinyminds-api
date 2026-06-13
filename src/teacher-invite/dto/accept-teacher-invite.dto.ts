import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AcceptTeacherInviteDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsString()
  username: string;
}
