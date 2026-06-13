import { Module } from '@nestjs/common';
import { TeacherInviteService } from './teacher-invite.service';
import { TeacherInviteController } from './teacher-invite.controller';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [TeacherInviteController],
  providers: [TeacherInviteService, PrismaService],
  exports: [TeacherInviteService],
})
export class TeacherInviteModule {}
