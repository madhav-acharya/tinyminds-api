import { AccountStatus, UserRole } from '@prisma/client';

export class User {
  id: string;
  full_name: string;
  email: string | null;
  username: string | null;
  password: string;
  role: UserRole;
  status: AccountStatus;
  created_at: Date;
  updated_at: Date;
}
