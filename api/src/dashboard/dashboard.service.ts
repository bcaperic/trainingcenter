import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboard(programId: string) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      traineeCount,
      attendanceRecords,
      submissionStats,
      pendingReviews,
      todaySessions,
    ] = await Promise.all([
      // Count active trainees
      this.prisma.programMembership.count({
        where: {
          programId,
          role: 'TRAINEE',
          status: 'ACTIVE',
        },
      }),

      // Get all attendance records for the program
      this.prisma.attendance.findMany({
        where: {
          session: { programId },
        },
        select: { status: true },
      }),

      // Get all submissions for the program's missions
      this.prisma.submission.findMany({
        where: {
          mission: { programId },
        },
        select: { status: true },
      }),

      // Count pending reviews (SUBMITTED status)
      this.prisma.submission.count({
        where: {
          mission: { programId },
          status: 'SUBMITTED',
        },
      }),

      // Today's sessions with enrolled count
      this.prisma.session.findMany({
        where: {
          programId,
          startAt: { gte: startOfDay, lt: endOfDay },
        },
        include: {
          _count: {
            select: { enrollments: true },
          },
        },
        orderBy: { startAt: 'asc' },
      }),
    ]);

    // Calculate average attendance rate
    const totalAttendance = attendanceRecords.length;
    const presentOrLate = attendanceRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;
    const avgAttendanceRate = totalAttendance > 0 ? presentOrLate / totalAttendance : 0;

    // Calculate average completion rate
    const totalSubmissions = submissionStats.length;
    const passOrReviewed = submissionStats.filter(
      (s) => s.status === 'PASS' || s.status === 'REVIEWED',
    ).length;
    const avgCompletionRate = totalSubmissions > 0 ? passOrReviewed / totalSubmissions : 0;

    // Format today's sessions
    const formattedSessions = todaySessions.map((s) => ({
      ...s,
      enrolledCount: s._count.enrollments,
      _count: undefined,
    }));

    return {
      traineeCount,
      avgAttendanceRate: Math.round(avgAttendanceRate * 10000) / 100,
      avgCompletionRate: Math.round(avgCompletionRate * 10000) / 100,
      pendingReviews,
      todaySessions: formattedSessions,
    };
  }

  async getRecentActivity(programId: string, limit = 15) {
    // Fetch recent attendance, submissions, and session changes in parallel
    const [recentAttendance, recentSubmissions, recentSessions] =
      await Promise.all([
        this.prisma.attendance.findMany({
          where: { session: { programId } },
          include: {
            user: { select: { id: true, name: true } },
            session: { select: { id: true, title: true } },
          },
          orderBy: { checkedInAt: 'desc' },
          take: limit,
        }),
        this.prisma.submission.findMany({
          where: { mission: { programId } },
          include: {
            user: { select: { id: true, name: true } },
            mission: { select: { id: true, title: true } },
          },
          orderBy: { submittedAt: 'desc' },
          take: limit,
        }),
        this.prisma.session.findMany({
          where: {
            programId,
            status: { in: ['CANCELED', 'ENDED'] },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        }),
      ]);

    // Merge into a unified activity list
    const activities: {
      id: string;
      type: 'checkin' | 'submission' | 'session';
      text: string;
      createdAt: string;
    }[] = [];

    for (const a of recentAttendance) {
      const statusLabel =
        a.status === 'LATE' ? 'marked late for' : 'checked in to';
      activities.push({
        id: `att-${a.id}`,
        type: 'checkin',
        text: `${a.user.name} ${statusLabel} ${a.session.title}`,
        createdAt: (a.checkedInAt ?? new Date()).toISOString(),
      });
    }

    for (const s of recentSubmissions) {
      activities.push({
        id: `sub-${s.id}`,
        type: 'submission',
        text: `${s.user.name} submitted ${s.mission.title}`,
        createdAt: s.submittedAt.toISOString(),
      });
    }

    for (const s of recentSessions) {
      const action =
        s.status === 'CANCELED' ? 'cancelled' : 'ended';
      activities.push({
        id: `ses-${s.id}`,
        type: 'session',
        text: `${s.title} ${action}`,
        createdAt: s.updatedAt.toISOString(),
      });
    }

    // Sort by createdAt desc and take top N
    activities.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return activities.slice(0, limit);
  }

  async getLearnerDashboard(programId: string, userId: string) {
    const now = new Date();

    const [
      attendanceRecords,
      submissions,
      latestReport,
      upcomingSessions,
    ] = await Promise.all([
      // User's attendance records in this program
      this.prisma.attendance.findMany({
        where: {
          userId,
          session: { programId },
        },
        select: { status: true },
      }),

      // User's submissions in this program
      this.prisma.submission.findMany({
        where: {
          userId,
          mission: { programId },
        },
        select: { status: true },
      }),

      // Latest weekly report
      this.prisma.weeklyReport.findFirst({
        where: {
          programId,
          userId,
        },
        orderBy: { generatedAt: 'desc' },
        select: {
          points: true,
          gateStatus: true,
          attendanceRate: true,
          completionRate: true,
        },
      }),

      // Upcoming enrolled sessions (limit 3)
      this.prisma.session.findMany({
        where: {
          programId,
          startAt: { gt: now },
          enrollments: {
            some: { userId },
          },
        },
        orderBy: { startAt: 'asc' },
        take: 3,
      }),
    ]);

    // Calculate attendance rate
    const totalAttendance = attendanceRecords.length;
    const presentOrLate = attendanceRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;
    const attendanceRate = totalAttendance > 0
      ? Math.round((presentOrLate / totalAttendance) * 10000) / 100
      : 0;

    // Calculate completion rate
    const totalSubmissions = submissions.length;
    const passOrReviewed = submissions.filter(
      (s) => s.status === 'PASS' || s.status === 'REVIEWED',
    ).length;
    const completionRate = totalSubmissions > 0
      ? Math.round((passOrReviewed / totalSubmissions) * 10000) / 100
      : 0;

    return {
      attendanceRate,
      completionRate,
      points: latestReport?.points ?? 0,
      gateStatus: latestReport?.gateStatus ?? 'NA',
      upcomingSessions,
    };
  }
}
