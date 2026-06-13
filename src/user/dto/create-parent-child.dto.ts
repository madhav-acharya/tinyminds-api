import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CapitalizeTransformer } from 'src/common/transformers/capitalize.transformer';
import { IsUnique } from 'src/common/validators/is-unique-validator';

export class CreateParentChildDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @CapitalizeTransformer()
  fullName: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @IsUnique('user', 'username')
  username: string;

  @IsOptional()
  @IsEmail()
  @IsUnique('user', 'email')
  email?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nextGoal?: string;
}