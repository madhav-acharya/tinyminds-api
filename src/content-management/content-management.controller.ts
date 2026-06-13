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
} from '@nestjs/common';
import { ContentManagementService } from './content-management.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { FindAllContentDto } from './dto/find-all-content.dto';
import { CreateContentQuestionDto } from './dto/create-question.dto';
import { UpdateContentQuestionDto } from './dto/update-question.dto';
import { FindAllContentQuestionDto } from './dto/find-all-question.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@UseGuards(AuthGuard, RolesGuard)
@Controller('content-management')
export class ContentManagementController {
  constructor(private readonly service: ContentManagementService) {}

  // Content Endpoints
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Post('content')
  createContent(@Body() dto: CreateContentDto) {
    return this.service.createContent(dto);
  }

  @Get('content')
  findAllContent(@Query() query: FindAllContentDto) {
    return this.service.findAllContent(query);
  }

  @Get('content/:id')
  findOneContent(@Param('id') id: string) {
    return this.service.findOneContent(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Patch('content/:id')
  updateContent(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.service.updateContent(id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('content/:id')
  removeContent(@Param('id') id: string) {
    return this.service.removeContent(id);
  }

  // Question Endpoints
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Post('questions')
  createQuestion(@Body() dto: CreateContentQuestionDto) {
    return this.service.createQuestion(dto);
  }

  @Get('questions')
  findAllQuestions(@Query() query: FindAllContentQuestionDto) {
    return this.service.findAllQuestions(query);
  }

  @Get('questions/:id')
  findOneQuestion(@Param('id') id: string) {
    return this.service.findOneQuestion(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateContentQuestionDto) {
    return this.service.updateQuestion(id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('questions/:id')
  removeQuestion(@Param('id') id: string) {
    return this.service.removeQuestion(id);
  }
}
