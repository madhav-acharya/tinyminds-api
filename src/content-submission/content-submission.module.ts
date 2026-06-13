import { Module } from '@nestjs/common';
import { ContentSubmissionService } from './content-submission.service';
import { ContentSubmissionController } from './content-submission.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContentSubmissionController],
  providers: [ContentSubmissionService],
  exports: [ContentSubmissionService],
})
export class ContentSubmissionModule {}
