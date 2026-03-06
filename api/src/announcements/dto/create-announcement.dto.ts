import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}
