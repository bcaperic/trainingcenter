import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TraineeReportRow {
  userId: string;
  userName: string;
  userEmail: string;
  teamName: string | null;
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
  pendingCount: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getWeeklyReport(
    programId: string,
    weekId?: string,
    teamId?: string,
  ) {
    // Get all active trainees (optionally filtered by team)
    const memberWhere: any = {
      programId,
      role: 'TRAINEE',
      status: 'ACTIVE',
    };
    if (teamId) memberWhere.teamId = teamId;

    const trainees = await this.prisma.programMembership.findMany({
      where: memberWhere,
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { name: true } },
      },
    });

    // Scope sessions and missions by weekId if provided
    const sessionWhere: any = { programId };
    const missionWhere: any = { programId };
    if (weekId) {
      sessionWhere.weekId = weekId;
      missionWhere.weekId = weekId;
    }

    const [sessions, missions, attendanceRecords, submissions] =
      await Promise.all([
        this.prisma.session.findMany({
          where: sessionWhere,
          select: { id: true },
        }),
        this.prisma.mission.findMany({
          where: missionWhere,
          select: { id: true },
        }),
        this.prisma.attendance.findMany({
          where: {
            session: sessionWhere,
          },
          select: { userId: true, status: true },
        }),
        this.prisma.submission.findMany({
          where: {
            mission: missionWhere,
          },
          select: { userId: true, status: true },
        }),
      ]);

    const totalSessions = sessions.length;
    const totalMissions = missions.length;

    // Build per-user attendance map
    const userAttendance = new Map<string, number>();
    for (const a of attendanceRecords) {
      if (a.status === 'PRESENT' || a.status === 'LATE') {
        userAttendance.set(a.userId, (userAttendance.get(a.userId) ?? 0) + 1);
      }
    }

    // Build per-user submission maps
    const userCompleted = new Map<string, number>();
    const userPending = new Map<string, number>();
    for (const s of submissions) {
      if (s.status === 'PASS' || s.status === 'REVIEWED') {
        userCompleted.set(s.userId, (userCompleted.get(s.userId) ?? 0) + 1);
      } else if (s.status === 'SUBMITTED') {
        userPending.set(s.userId, (userPending.get(s.userId) ?? 0) + 1);
      }
    }

    // Build per-trainee rows
    const rows: TraineeReportRow[] = trainees.map((m) => {
      const uid = m.user.id;
      const attended = userAttendance.get(uid) ?? 0;
      const completed = userCompleted.get(uid) ?? 0;
      const pending = userPending.get(uid) ?? 0;
      const attendanceRate =
        totalSessions > 0
          ? Math.round((attended / totalSessions) * 10000) / 100
          : 0;
      const completionRate =
        totalMissions > 0
          ? Math.round((completed / totalMissions) * 10000) / 100
          : 0;

      return {
        userId: uid,
        userName: m.user.name,
        userEmail: m.user.email,
        teamName: m.team?.name ?? null,
        totalSessions,
        attendedSessions: attended,
        attendanceRate,
        totalMissions,
        completedMissions: completed,
        completionRate,
        pendingCount: pending,
      };
    });

    // Summary
    const traineeCount = rows.length;
    const avgAttendanceRate =
      traineeCount > 0
        ? Math.round(
            (rows.reduce((s, r) => s + r.attendanceRate, 0) / traineeCount) *
              100,
          ) / 100
        : 0;
    const avgCompletionRate =
      traineeCount > 0
        ? Math.round(
            (rows.reduce((s, r) => s + r.completionRate, 0) / traineeCount) *
              100,
          ) / 100
        : 0;
    const totalPendingReviews = rows.reduce((s, r) => s + r.pendingCount, 0);

    return {
      data: rows,
      summary: {
        traineeCount,
        avgAttendanceRate,
        avgCompletionRate,
        totalPendingReviews,
        totalSessions,
        totalMissions,
      },
    };
  }
}
