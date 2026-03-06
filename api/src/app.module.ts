import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProgramsModule } from './programs/programs.module';
import { MembershipsModule } from './memberships/memberships.module';
import { TeamsModule } from './teams/teams.module';
import { WeeksModule } from './weeks/weeks.module';
import { SessionsModule } from './sessions/sessions.module';
import { MissionsModule } from './missions/missions.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RecordingsModule } from './recordings/recordings.module';
import { ReportsModule } from './reports/reports.module';
import { UploadModule } from './upload/upload.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProgramsModule,
    MembershipsModule,
    TeamsModule,
    WeeksModule,
    SessionsModule,
    MissionsModule,
    SubmissionsModule,
    EnrollmentsModule,
    AttendanceModule,
    AnnouncementsModule,
    NotificationsModule,
    DashboardModule,
    RecordingsModule,
    ReportsModule,
    UploadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
