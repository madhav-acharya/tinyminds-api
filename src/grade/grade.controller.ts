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
import { GradeService } from './grade.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { FindAllGradeDto } from './dto/find-all-grade.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@UseGuards(AuthGuard, RolesGuard)
@Controller('grade')
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  @Post()
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradeService.create(createGradeDto);
  }

  @Get()
  findAll(@Query() query: FindAllGradeDto) {
    return this.gradeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gradeService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGradeDto: UpdateGradeDto) {
    return this.gradeService.update(id, updateGradeDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gradeService.remove(id);
  }
}
