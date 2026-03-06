import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecordingsService {
  constructor(private prisma: PrismaService) {}

  async findMyRecordings(programId: string, userId: string) {
    // Check user's membership role
    const membership = await this.prisma.programMembership.findFirst({
      where: {
        programId,
        userId,
        status: 'ACTIVE',
      },
      select: { role: true },
    });

    const isAdminOrInstructor =
      membership?.role === 'ADMIN' || membership?.role === 'INSTRUCTOR';

    // Build the where clause depending on role
    const where = {
      programId,
      recordingUrl: { not: null },
      ...(isAdminOrInstructor
        ? {}
        : {
            enrollments: {
              some: { userId },
            },
          }),
    };

    const sessions = await this.prisma.session.findMany({
      where,
      include: {
        week: {
          select: {
            id: true,
            weekNo: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { startAt: 'desc' },
    });

    // Group sessions by week
    const weekMap = new Map<string, { weekId: string | null; week: any; sessions: any[] }>();

    for (const session of sessions) {
      const key = session.weekId ?? 'no-week';
      if (!weekMap.has(key)) {
        weekMap.set(key, {
          weekId: session.weekId,
          week: session.week,
          sessions: [],
        });
      }
      weekMap.get(key)!.sessions.push(session);
    }

    return Array.from(weekMap.values());
  }
}
