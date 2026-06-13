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
import { ContentManagementModule } from './content-management/content-management.module';
import { ContentSubmissionModule } from './content-submission/content-submission.module';
import { LearnerInviteModule } from './learner-invite/learner-invite.module';
import { TeacherInviteModule } from './teacher-invite/teacher-invite.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PrismaService } from './prisma.service';
import { AssetModule } from './asset/asset.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    InstitutionModule,
    GradeModule,
    LearningModuleModule,
    ContentManagementModule,
    LearnerInviteModule,
    TeacherInviteModule,
    UserModule,
    AuthModule,
    InstitutionLearnerModule,
    ContentSubmissionModule,
    CloudinaryModule,
    AssetModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
