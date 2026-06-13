import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { TeacherInviteService } from './teacher-invite.service';
import { CreateTeacherInviteDto } from './dto/create-teacher-invite.dto';
import { AcceptTeacherInviteDto } from './dto/accept-teacher-invite.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('teacher-invite')
export class TeacherInviteController {
  constructor(private readonly teacherInviteService: TeacherInviteService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  @Post()
  createInvite(@Body() createDto: CreateTeacherInviteDto) {
    return this.teacherInviteService.createInvite(createDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  @Get()
  getInvites(@Query('institutionId') institutionId: string) {
    return this.teacherInviteService.getInvites(institutionId);
  }

  @Post(':id/accept')
  acceptInvite(
    @Param('id') id: string,
    @Body() acceptDto: AcceptTeacherInviteDto,
  ) {
    return this.teacherInviteService.acceptInvite(id, acceptDto);
  }

  @Post(':id/reject')
  rejectInvite(@Param('id') id: string) {
    return this.teacherInviteService.rejectInvite(id);
  }
}
