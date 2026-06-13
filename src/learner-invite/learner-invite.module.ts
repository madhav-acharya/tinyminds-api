import { Module } from '@nestjs/common';
import { LearnerInviteService } from './learner-invite.service';
import { LearnerInviteController } from './learner-invite.controller';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [LearnerInviteController],
  providers: [LearnerInviteService, PrismaService],
})
export class LearnerInviteModule {}
