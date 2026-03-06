import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { MembershipRole, MembershipStatus } from '@prisma/client';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole = MembershipRole.TRAINEE;

  @IsOptional()
  @IsString()
  teamId?: string;
}

export class UpdateMembershipDto {
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;
}
