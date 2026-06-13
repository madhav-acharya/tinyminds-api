import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('learner/:id/interests')
  async getLearnerInterests(@Param('id') learnerId: string) {
    return this.analyticsService.getLearnerInterests(learnerId);
  }
}
