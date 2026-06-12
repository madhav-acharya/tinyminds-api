import { Module, forwardRef } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
