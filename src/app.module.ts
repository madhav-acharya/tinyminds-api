import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { InstitutionModule } from './institution/institution.module';

@Module({
  imports: [UserModule, AuthModule, InstitutionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
