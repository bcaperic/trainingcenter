import { IsInt, Min, IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateWeekDto {
  @IsInt()
  @Min(1)
  weekNo: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class UpdateWeekDto extends PartialType(CreateWeekDto) {}
