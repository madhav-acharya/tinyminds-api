import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { LearnerInviteService } from './learner-invite.service';
import { CreateLearnerInviteDto } from './dto/create-learner-invite.dto';

import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ActiveUserData } from '../common/interfaces/active-user.interface';
import { LearnerInvite } from './entities/learner-invite.entity';

@UseGuards(AuthGuard, RolesGuard)
@Controller('learner-invite')
export class LearnerInviteController {
  constructor(private readonly learnerInviteService: LearnerInviteService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER, UserRole.TEACHER)
  @Post()
  createInvite(@Body() createDto: CreateLearnerInviteDto): Promise<LearnerInvite> {
    return this.learnerInviteService.createInvite(createDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER, UserRole.TEACHER)
  @Get()
  getInvites(@Query('institutionId') institutionId: string) {
    return this.learnerInviteService.getInvites(institutionId);
  }

  @Roles(UserRole.PARENT)
  @Get('parent')
  getParentInvites(@Req() req: any): Promise<LearnerInvite[]> {
    const user = req.user as ActiveUserData;
    return this.learnerInviteService.getParentInvites(user.sub);
  }

  @Roles(UserRole.PARENT)
  @Post(':id/accept')
  acceptInvite(@Param('id') id: string) {
    return this.learnerInviteService.acceptInvite(id);
  }

  @Roles(UserRole.PARENT)
  @Post(':id/reject')
  rejectInvite(@Param('id') id: string) {
    return this.learnerInviteService.rejectInvite(id);
  }
}
