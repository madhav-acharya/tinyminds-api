import { UserRole } from '../enums/user-role.enum';

export interface ActiveUserData {
  sub: string;
  email: string;
  role: UserRole;
  institutionId?: string | null;
}
