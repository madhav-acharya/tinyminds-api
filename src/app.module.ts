import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { InstitutionModule } from './institution/institution.module';
import { InstitutionLearnerModule } from './institution-learner/institution-learner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    InstitutionModule,
    UserModule,
    AuthModule,
    InstitutionLearnerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
