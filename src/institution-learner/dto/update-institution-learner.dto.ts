import { PartialType } from '@nestjs/mapped-types';

import { CreateInstitutionLearnerDto } from './create-institution-learner.dto';

export class UpdateInstitutionLearnerDto extends PartialType(
  CreateInstitutionLearnerDto,
) {}