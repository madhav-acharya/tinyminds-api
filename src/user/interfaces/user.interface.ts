import { UserRole, AccountStatus } from '@prisma/client';

export interface IUser {
  id: string;
  fullName: string;
  email: string | null;
  username: string | null;
  role: UserRole;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}
