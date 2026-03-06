import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPolicyConfig } from '../common/config/policy.config';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async enroll(programId: string, sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if session has a recording URL (no enrollment needed)
    if (session.recordingUrl) {
      throw new BadRequestException(
        'This session has a recording available; enrollment is not required',
      );
    }

    // Check enrollment deadline
    const policy = getPolicyConfig();
    const deadline = new Date(
      session.startAt.getTime() - policy.enrollCloseMinutes * 60_000,
    );

    if (new Date() > deadline) {
      throw new BadRequestException(
        'Enrollment deadline has passed for this session',
      );
    }

    // Count current enrollments (excluding canceled)
    const enrolledCount = await this.prisma.enrollment.count({
      where: {
        sessionId,
        status: { not: 'CANCELED' },
      },
    });

    // Determine status based on capacity
    const status =
      session.capacity && enrolledCount >= session.capacity
        ? 'WAITLISTED'
        : 'APPLIED';

    // Check for existing enrollment (including canceled)
    const existing = await this.prisma.enrollment.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (existing) {
      if (existing.status !== 'CANCELED') {
        throw new ConflictException('You are already enrolled in this session');
      }
      // Re-activate canceled enrollment
      return this.prisma.enrollment.update({
        where: { id: existing.id },
        data: { status, appliedAt: new Date() },
      });
    }

    return this.prisma.enrollment.create({
      data: {
        programId,
        sessionId,
        userId,
        status,
      },
    });
  }

  async cancel(programId: string, sessionId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        sessionId_userId: { sessionId, userId },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'CANCELED' },
    });
  }

  async findMyEnrollments(programId: string, userId: string) {
    return this.prisma.enrollment.findMany({
      where: {
        programId,
        userId,
      },
      include: {
        session: true,
      },
      orderBy: { appliedAt: 'desc' },
    });
  }
}
