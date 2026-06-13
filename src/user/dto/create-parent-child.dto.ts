import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CapitalizeTransformer } from 'src/common/transformers/capitalize.transformer';

export class CreateParentChildDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @CapitalizeTransformer()
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nextGoal?: string;
}