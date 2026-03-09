import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/create-session.dto';
import { PaginationQueryDto, paginate, paginatedResponse } from '../common/dto/pagination-query.dto';
import { getPolicyConfig } from '../common/config/policy.config';
import { randomBytes } from 'crypto';
import { extname } from 'path';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

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
          instructor: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              enrollments: { where: { status: { not: 'CANCELED' } } },
              attachments: true,
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
      instructorName: s.instructor?.name || null,
      enrolledCount: s._count.enrollments,
      attachmentCount: s._count.attachments,
      _count: undefined,
      instructor: undefined,
    }));

    return paginatedResponse(data, total, query);
  }

  async findOne(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        enrollments: true,
        attendances: true,
        attachments: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      ...session,
      instructorName: session.instructor?.name || null,
    };
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
        instructorId: dto.instructorId || null,
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

    if ('instructorId' in dto) {
      data.instructorId = dto.instructorId || null;
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

  // ── Session Attachments ──

  async listSessionAttachments(sessionId: string) {
    return this.prisma.sessionAttachment.findMany({
      where: { sessionId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async uploadSessionAttachment(sessionId: string, file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('No file provided');

    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const ext = extname(file.originalname) || '';
    const key = `sessions/${sessionId}/${randomBytes(16).toString('hex')}${ext}`;
    await this.uploadService.upload(key, file.buffer, file.mimetype);

    return this.prisma.sessionAttachment.create({
      data: {
        sessionId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key,
        uploadedBy: userId,
      },
    });
  }

  async downloadSessionAttachment(sessionId: string, attachmentId: string) {
    const attachment = await this.prisma.sessionAttachment.findFirst({
      where: { id: attachmentId, sessionId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    const stream = await this.uploadService.getStream(attachment.key);
    return { stream, attachment };
  }

  async deleteSessionAttachment(sessionId: string, attachmentId: string) {
    const attachment = await this.prisma.sessionAttachment.findFirst({
      where: { id: attachmentId, sessionId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.prisma.sessionAttachment.delete({ where: { id: attachmentId } });
    return { success: true };
  }
}
