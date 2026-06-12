import { Module, forwardRef } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [InstitutionController],
  providers: [InstitutionService],
})
export class InstitutionModule {}
