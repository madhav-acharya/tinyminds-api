import { Module as NestModule, forwardRef } from '@nestjs/common';
import { ModuleService } from './module.service';
import { ModuleController } from './module.controller';
import { AuthModule } from '../auth/auth.module';

@NestModule({
  imports: [forwardRef(() => AuthModule)],
  controllers: [ModuleController],
  providers: [ModuleService],
  exports: [ModuleService],
})
export class LearningModuleModule {}
