import { PartialType } from '@nestjs/mapped-types';
import { CreateContentQuestionDto } from './create-content-question.dto';

export class UpdateContentQuestionDto extends PartialType(CreateContentQuestionDto) {}
