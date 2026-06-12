import { Module } from '@nestjs/common';
import { LearnerInviteService } from './learner-invite.service';
import { LearnerInviteController } from './learner-invite.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [LearnerInviteController],
  providers: [LearnerInviteService],
})
export class LearnerInviteModule {}
