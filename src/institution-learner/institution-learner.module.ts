import { Module } from '@nestjs/common';
import { InstitutionLearnerService } from './institution-learner.service';
import { InstitutionLearnerController } from './institution-learner.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [InstitutionLearnerController],
  providers: [InstitutionLearnerService, PrismaService],
})
export class InstitutionLearnerModule {}
