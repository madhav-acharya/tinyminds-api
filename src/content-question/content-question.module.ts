import { Module, forwardRef } from '@nestjs/common';
import { ContentQuestionService } from './content-question.service';
import { ContentQuestionController } from './content-question.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [ContentQuestionController],
  providers: [ContentQuestionService],
  exports: [ContentQuestionService],
})
export class ContentQuestionModule {}
