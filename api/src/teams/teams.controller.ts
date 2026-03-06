import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/create-team.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  findAll(@Param('programId') programId: string) {
    return this.teamsService.findAll(programId);
  }

  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  create(
    @Param('programId') programId: string,
    @Body() dto: CreateTeamDto,
  ) {
    return this.teamsService.create(programId, dto);
  }

  @Put(':teamId')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  update(
    @Param('teamId') teamId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(teamId, dto);
  }
}
