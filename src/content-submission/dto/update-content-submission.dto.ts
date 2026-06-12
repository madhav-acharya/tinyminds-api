import { PartialType } from '@nestjs/mapped-types';
import { CreateContentSubmissionDto } from './create-content-submission.dto';

export class UpdateContentSubmissionDto extends PartialType(CreateContentSubmissionDto) {}
