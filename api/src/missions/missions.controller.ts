import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto, UpdateMissionDto } from './dto/create-mission.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId/missions')
export class MissionsController {
  constructor(private missionsService: MissionsService) {}

  @Get('weeks/:weekId')
  findByWeek(
    @Param('programId') programId: string,
    @Param('weekId') weekId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.missionsService.findByWeek(programId, weekId, userId);
  }

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  create(
    @Param('programId') programId: string,
    @Body() dto: CreateMissionDto,
  ) {
    return this.missionsService.create(programId, dto);
  }

  @Put(':missionId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  update(
    @Param('missionId') missionId: string,
    @Body() dto: UpdateMissionDto,
  ) {
    return this.missionsService.update(missionId, dto);
  }

  @Post(':missionId/publish')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  publish(@Param('missionId') missionId: string) {
    return this.missionsService.publish(missionId);
  }
}
