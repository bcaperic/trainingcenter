import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { SubmissionStatus } from '@prisma/client';

export class CreateSubmissionDto {
  @IsOptional()
  @IsString()
  contentText?: string;

  @IsOptional()
  @IsString()
  contentUrl?: string;
}

export class ReviewSubmissionDto {
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
