import { AccountStatus } from '@prisma/client';
import { UserRole } from 'src/common/enums/user-role.enum';
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
import { CreateInstitutionDto } from 'src/institution/dto/create-institution.dto';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  isPublic?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateInstitutionDto)
  institution?: CreateInstitutionDto;
}
