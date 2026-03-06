import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { MissionType } from '@prisma/client';

export class CreateMissionDto {
  @IsString()
  @IsNotEmpty()
  weekId: string;

  @IsEnum(MissionType)
  type: MissionType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class UpdateMissionDto extends PartialType(CreateMissionDto) {}
