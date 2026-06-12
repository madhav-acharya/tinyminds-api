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
import { ContentQuestionService } from './content-question.service';
import { CreateContentQuestionDto } from './dto/create-content-question.dto';
import { UpdateContentQuestionDto } from './dto/update-content-question.dto';
import { FindAllContentQuestionDto } from './dto/find-all-content-question.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@UseGuards(AuthGuard, RolesGuard)
@Controller('content-question')
export class ContentQuestionController {
  constructor(
    private readonly contentQuestionService: ContentQuestionService,
  ) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  create(@Body() createContentQuestionDto: CreateContentQuestionDto) {
    return this.contentQuestionService.create(createContentQuestionDto);
  }

  @Get()
  findAll(@Query() query: FindAllContentQuestionDto) {
    return this.contentQuestionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentQuestionService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContentQuestionDto: UpdateContentQuestionDto,
  ) {
    return this.contentQuestionService.update(id, updateContentQuestionDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentQuestionService.remove(id);
  }
}
