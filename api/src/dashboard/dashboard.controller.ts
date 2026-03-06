import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('programs/:programId/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  getAdminDashboard(@Param('programId') programId: string) {
    return this.dashboardService.getAdminDashboard(programId);
  }

  @Get('activity')
  @Roles('ADMIN', 'INSTRUCTOR')
  @UseGuards(RolesGuard)
  getRecentActivity(@Param('programId') programId: string) {
    return this.dashboardService.getRecentActivity(programId);
  }

  @Get('learner')
  getLearnerDashboard(
    @Param('programId') programId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.dashboardService.getLearnerDashboard(programId, user.id);
  }
}
