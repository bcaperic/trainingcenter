import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('weekly')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  getWeeklyReport(
    @Param('programId') programId: string,
    @Query('weekId') weekId?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.reportsService.getWeeklyReport(programId, weekId, teamId);
  }
}
