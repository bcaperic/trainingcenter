import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckinDto } from './dto/checkin.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('sessions/:sessionId/checkin')
  checkin(
    @Param('programId') programId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CheckinDto,
  ) {
    return this.attendanceService.checkin(programId, sessionId, userId, dto);
  }

  @Get('me/attendance')
  findMyAttendance(
    @Param('programId') programId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.attendanceService.findMyAttendance(programId, userId);
  }

  @Get('sessions/:sessionId/attendance')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  findBySession(@Param('sessionId') sessionId: string) {
    return this.attendanceService.findBySession(sessionId);
  }

  @Get('sessions/:sessionId/attendance/detail')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  getSessionDetail(
    @Param('programId') programId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.attendanceService.getSessionDetail(programId, sessionId);
  }

  @Get('sessions/:sessionId/ops-summary')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  getOpsSummary(
    @Param('programId') programId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.attendanceService.getOpsSummary(programId, sessionId);
  }
}
