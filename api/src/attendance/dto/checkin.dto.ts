import { IsString, IsOptional } from 'class-validator';

export class CheckinDto {
  @IsString()
  @IsOptional()
  code?: string;
}
