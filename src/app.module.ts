import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { InstitutionModule } from './institution/institution.module';
import { InstitutionLearnerModule } from './institution-learner/institution-learner.module';
import { LearningModuleModule } from './module/learning-module.module';
import { GradeModule } from './grade/grade.module';
import { ContentModule } from './content/content.module';
import { ContentQuestionModule } from './content-question/content-question.module';
import { ContentSubmissionModule } from './content-submission/content-submission.module';
import { LearnerInviteModule } from './learner-invite/learner-invite.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    InstitutionModule,
    GradeModule,
    LearningModuleModule,
    ContentModule,
    ContentQuestionModule,
    LearnerInviteModule,
    UserModule,
    AuthModule,
    InstitutionLearnerModule,
    ContentSubmissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
