import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InstitutionLearnerService } from './institution-learner.service';
import { CreateInstitutionLearnerDto } from './dto/create-institution-learner.dto';
import { UpdateInstitutionLearnerDto } from './dto/update-institution-learner.dto';
import { FindAllInstitutionLearnersDto } from './dto/find-all-institutional-learner.dto';

@Controller('institution-learner')
export class InstitutionLearnerController {
  constructor(
    private readonly institutionLearnerService: InstitutionLearnerService,
  ) {}

  @Post()
  create(@Body() dto: CreateInstitutionLearnerDto) {
    return this.institutionLearnerService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindAllInstitutionLearnersDto) {
    return this.institutionLearnerService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.institutionLearnerService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionLearnerDto,
  ) {
    return this.institutionLearnerService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.institutionLearnerService.remove(id);
  }
}