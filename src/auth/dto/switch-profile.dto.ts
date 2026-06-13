import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class SwitchProfileDto {
  @IsEnum(UserRole)
  targetRole: UserRole;

  @IsOptional()
  @IsString()
  learnerProfileId?: string;
}
