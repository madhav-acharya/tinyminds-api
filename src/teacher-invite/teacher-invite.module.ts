import { Module } from '@nestjs/common';
import { TeacherInviteService } from './teacher-invite.service';
import { TeacherInviteController } from './teacher-invite.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TeacherInviteController],
  providers: [TeacherInviteService],
  exports: [TeacherInviteService],
})
export class TeacherInviteModule {}
