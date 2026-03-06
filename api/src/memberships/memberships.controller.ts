import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { InviteUserDto, UpdateMembershipDto } from './dto/invite-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId/users')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  findAll(
    @Param('programId') programId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.membershipsService.findAll(programId, query);
  }

  @Post('invite')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  invite(
    @Param('programId') programId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.membershipsService.invite(programId, dto);
  }

  @Put(':userId')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  update(
    @Param('programId') programId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.membershipsService.update(programId, userId, dto);
  }
}
