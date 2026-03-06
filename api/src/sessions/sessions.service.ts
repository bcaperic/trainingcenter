import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/create-session.dto';
import { PaginationQueryDto, paginate, paginatedResponse } from '../common/dto/pagination-query.dto';
import { getPolicyConfig } from '../common/config/policy.config';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    programId: string,
    query: PaginationQueryDto & { weekId?: string; from?: string; to?: string },
  ) {
    const where: any = { programId };

    if (query.weekId) {
      where.weekId = query.weekId;
    }
    if (query.from) {
      where.startAt = { ...where.startAt, gte: new Date(query.from) };
    }
    if (query.to) {
      where.startAt = { ...where.startAt, lte: new Date(query.to) };
    }

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        include: {
          _count: {
            select: {
              enrollments: { where: { status: { not: 'CANCELED' } } },
            },
          },
        },
        orderBy: { startAt: query.order || 'asc' },
        ...paginate(query),
      }),
      this.prisma.session.count({ where }),
    ]);

    const data = sessions.map((s) => ({
      ...s,
      enrolledCount: s._count.enrollments,
      _count: undefined,
    }));

    return paginatedResponse(data, total, query);
  }

  async findOne(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        enrollments: true,
        attendances: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async create(programId: string, dto: CreateSessionDto) {
    const policy = getPolicyConfig();
    const startAt = new Date(dto.startAt);
    const checkinOpenAt = new Date(startAt.getTime() - policy.checkinOpenMinutes * 60_000);
    const checkinCloseAt = new Date(startAt.getTime() + policy.checkinCloseMinutes * 60_000);

    return this.prisma.session.create({
      data: {
        programId,
        weekId: dto.weekId,
        type: dto.type,
        title: dto.title,
        description: dto.description ?? '',
        startAt,
        endAt: new Date(dto.endAt),
        capacity: dto.capacity,
        locationOrUrl: dto.locationOrUrl,
        checkinMode: dto.checkinMode,
        checkinOpenAt,
        checkinCloseAt,
      },
    });
  }

  async update(sessionId: string, dto: UpdateSessionDto) {
    const existing = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new NotFoundException('Session not found');
    }

    const data: any = { ...dto };

    if (dto.startAt) {
      const policy = getPolicyConfig();
      const startAt = new Date(dto.startAt);
      data.startAt = startAt;
      data.checkinOpenAt = new Date(startAt.getTime() - policy.checkinOpenMinutes * 60_000);
      data.checkinCloseAt = new Date(startAt.getTime() + policy.checkinCloseMinutes * 60_000);
    }

    if (dto.endAt) {
      data.endAt = new Date(dto.endAt);
    }

    return this.prisma.session.update({
      where: { id: sessionId },
      data,
    });
  }

  async cancel(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CANCELED' },
    });
  }

  async setRecordingUrl(sessionId: string, url: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.session.update({
      where: { id: sessionId },
      data: { recordingUrl: url },
    });
  }

  async generateCheckinCode(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hash = await bcrypt.hash(code, 10);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { checkinCodeHash: hash },
    });

    return { code };
  }
}
