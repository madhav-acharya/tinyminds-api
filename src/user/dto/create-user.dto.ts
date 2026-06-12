import { AccountStatus, UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CapitalizeTransformer } from 'src/common/transformers/capitalize.transformer';
import { IsUnique } from 'src/common/validators/is-unique-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @CapitalizeTransformer()
  fullName: string;

  @IsOptional()
  @IsEmail()
  @IsUnique('user', 'email')
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @IsUnique('user', 'username')
  username?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
