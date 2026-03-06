import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CheckinDto } from './dto/checkin.dto';
import { getPolicyConfig } from '../common/config/policy.config';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkin(
    programId: string,
    sessionId: string,
    userId: string,
    dto: CheckinDto,
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check session status
    if (session.status !== 'PUBLISHED' && session.status !== 'ONGOING') {
      throw new BadRequestException(
        'Check-in is not available for this session',
      );
    }

    // Check checkin window
    const now = new Date();
    if (
      !session.checkinOpenAt ||
      !session.checkinCloseAt ||
      now < session.checkinOpenAt ||
      now > session.checkinCloseAt
    ) {
      throw new BadRequestException('Check-in window has expired or is not yet open');
    }

    // Check duplicate attendance
    const existing = await this.prisma.attendance.findUnique({
      where: {
        sessionId_userId: { sessionId, userId },
      },
    });

    if (existing) {
      throw new BadRequestException('You have already checked in to this session');
    }

    // If CODE mode, verify the code
    let method: 'CODE' | 'BUTTON' | 'MANUAL' = 'BUTTON';

    if (session.checkinMode === 'CODE') {
      if (!dto.code) {
        throw new BadRequestException('Check-in code is required');
      }

      if (!session.checkinCodeHash) {
        throw new BadRequestException('No check-in code has been generated for this session');
      }

      const isValid = await bcrypt.compare(dto.code, session.checkinCodeHash);
      if (!isValid) {
        throw new BadRequestException('Invalid check-in code');
      }

      method = 'CODE';
    }

    // Determine attendance status (PRESENT or LATE)
    const policy = getPolicyConfig();
    const lateThreshold = new Date(
      session.startAt.getTime() + policy.lateGraceMinutes * 60_000,
    );

    const status = now > lateThreshold ? 'LATE' : 'PRESENT';

    const attendance = await this.prisma.attendance.create({
      data: {
        programId,
        sessionId,
        userId,
        status,
        checkedInAt: now,
        method,
      },
    });

    return {
      status: status === 'LATE' ? 'late' : 'success',
      attendance,
    };
  }

  async findMyAttendance(programId: string, userId: string) {
    return this.prisma.attendance.findMany({
      where: {
        programId,
        userId,
      },
      include: {
        session: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySession(sessionId: string) {
    return this.prisma.attendance.findMany({
      where: { sessionId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSessionDetail(programId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Get all trainees in the program
    const trainees = await this.prisma.programMembership.findMany({
      where: { programId, role: 'TRAINEE', status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { name: true } },
      },
    });

    // Get attendance records for this session
    const attendances = await this.prisma.attendance.findMany({
      where: { sessionId },
    });

    // Get missions for the same week as this session
    const missions = session.weekId
      ? await this.prisma.mission.findMany({
          where: { programId, weekId: session.weekId },
          select: { id: true },
        })
      : [];

    const missionIds = missions.map((m) => m.id);

    // Get submissions for those missions from all trainees
    const submissions =
      missionIds.length > 0
        ? await this.prisma.submission.findMany({
            where: { missionId: { in: missionIds } },
            select: { userId: true, status: true },
          })
        : [];

    // Build maps
    const attendanceMap = new Map(attendances.map((a) => [a.userId, a]));
    const userSubmissions = new Map<string, number>();
    for (const s of submissions) {
      if (s.status === 'PASS' || s.status === 'REVIEWED') {
        userSubmissions.set(s.userId, (userSubmissions.get(s.userId) ?? 0) + 1);
      }
    }

    const checkedInCount = attendances.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;

    const rows = trainees.map((m) => {
      const att = attendanceMap.get(m.user.id);
      return {
        userId: m.user.id,
        userName: m.user.name,
        userEmail: m.user.email,
        teamName: m.team?.name ?? null,
        attendanceStatus: att?.status ?? null,
        checkedInAt: att?.checkedInAt ?? null,
        completedMissions: userSubmissions.get(m.user.id) ?? 0,
        totalMissions: missionIds.length,
      };
    });

    return {
      session,
      summary: {
        totalTrainees: trainees.length,
        checkedIn: checkedInCount,
        notCheckedIn: trainees.length - checkedInCount,
        totalMissions: missionIds.length,
      },
      trainees: rows,
    };
  }

  async getOpsSummary(programId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Get all trainees in the program
    const trainees = await this.prisma.programMembership.findMany({
      where: { programId, role: 'TRAINEE', status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { name: true } },
      },
    });

    // Get attendance records for this session
    const attendances = await this.prisma.attendance.findMany({
      where: { sessionId },
    });

    // Get missions for the same week as this session
    const missions = session.weekId
      ? await this.prisma.mission.findMany({
          where: { programId, weekId: session.weekId },
          select: { id: true },
        })
      : [];

    const missionIds = missions.map((m) => m.id);

    // Get all submissions for those missions (with status + submittedAt)
    const submissions =
      missionIds.length > 0
        ? await this.prisma.submission.findMany({
            where: { missionId: { in: missionIds } },
            select: { userId: true, status: true, submittedAt: true },
          })
        : [];

    // Build maps
    const attendanceMap = new Map(attendances.map((a) => [a.userId, a]));

    // Per-user: count completed, track latest submission status + time
    const userCompleted = new Map<string, number>();
    const userLatestSubmission = new Map<
      string,
      { status: string; submittedAt: Date }
    >();

    for (const s of submissions) {
      if (s.status === 'PASS' || s.status === 'REVIEWED') {
        userCompleted.set(s.userId, (userCompleted.get(s.userId) ?? 0) + 1);
      }
      const prev = userLatestSubmission.get(s.userId);
      if (!prev || s.submittedAt > prev.submittedAt) {
        userLatestSubmission.set(s.userId, {
          status: s.status,
          submittedAt: s.submittedAt,
        });
      }
    }

    const checkedInCount = attendances.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;
    const lateCount = attendances.filter((a) => a.status === 'LATE').length;

    const rows = trainees.map((m) => {
      const att = attendanceMap.get(m.user.id);
      const latest = userLatestSubmission.get(m.user.id);
      return {
        userId: m.user.id,
        userName: m.user.name,
        userEmail: m.user.email,
        teamName: m.team?.name ?? null,
        attendanceStatus: att?.status ?? null,
        checkedInAt: att?.checkedInAt ?? null,
        completedMissions: userCompleted.get(m.user.id) ?? 0,
        totalMissions: missionIds.length,
        testSubmissionStatus: latest?.status ?? null,
        submittedAt: latest?.submittedAt ?? null,
      };
    });

    return {
      session,
      summary: {
        totalTrainees: trainees.length,
        checkedIn: checkedInCount,
        lateCount,
        notCheckedIn: trainees.length - checkedInCount,
        totalMissions: missionIds.length,
      },
      trainees: rows,
    };
  }
}
