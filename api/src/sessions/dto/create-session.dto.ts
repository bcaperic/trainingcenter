import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { SessionType, CheckinMode } from '@prisma/client';

export class CreateSessionDto {
  @IsString()
  @IsOptional()
  weekId?: string;

  @IsString()
  @IsOptional()
  instructorId?: string;

  @IsEnum(SessionType)
  type: SessionType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  capacity?: number;

  @IsString()
  @IsOptional()
  locationOrUrl?: string;

  @IsEnum(CheckinMode)
  @IsOptional()
  checkinMode?: CheckinMode;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {}
