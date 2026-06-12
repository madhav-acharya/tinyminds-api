import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptLearnerInviteDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
