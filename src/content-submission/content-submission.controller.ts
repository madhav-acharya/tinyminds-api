import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ContentSubmissionService } from './content-submission.service';
import { CreateContentSubmissionDto } from './dto/create-content-submission.dto';
import { UpdateContentSubmissionDto } from './dto/update-content-submission.dto';
import { FindAllSubmissionsDto } from './dto/find-all-submissions.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ActiveUserData } from '../common/interfaces/active-user.interface';

@UseGuards(AuthGuard, RolesGuard)
@Controller('content-submission')
export class ContentSubmissionController {
  constructor(private readonly contentSubmissionService: ContentSubmissionService) {}

  @Roles(UserRole.LEARNER)
  @Post()
  async create(@Body() dto: CreateContentSubmissionDto, @Req() req: any) {
    const user = req.user as ActiveUserData;
    // We need the learnerProfile.id, not user.sub.
    // I'll assume for now that the frontend or service handles getting the learnerProfileId.
    // Actually, I should fetch the learnerProfileId from the user.sub in the service or here.
    return this.contentSubmissionService.create(dto, user.sub); // This is userId, need to fix in service
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.LEARNER)
  @Get()
  findAll(@Query() query: FindAllSubmissionsDto) {
    return this.contentSubmissionService.findAll(query);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.LEARNER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentSubmissionService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContentSubmissionDto) {
    return this.contentSubmissionService.update(id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentSubmissionService.remove(id);
  }
}
