import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('learner/:learnerId/interests')
  async getLearnerInterests(@Param('learnerId') learnerId: string, @Request() req: any) {
    return this.analyticsService.getLearnerInterests(learnerId, req.user.sub);
  }
}
