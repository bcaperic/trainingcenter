import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateProgramDto, UpdateProgramDto } from './dto/create-program.dto';
import {
  PaginationQueryDto,
  paginate,
  paginatedResponse,
} from '../common/dto/pagination-query.dto';
import { ProgramStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

@Injectable()
export class ProgramsService {
  constructor(
    private prisma: PrismaService,
    private upload: UploadService,
  ) {}

  async findAll(userId: string, query: PaginationQueryDto) {
    // Check if the user has any ADMIN membership
    const adminMembership = await this.prisma.programMembership.findFirst({
      where: {
        userId,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const isAdmin = !!adminMembership;

    const searchFilter = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' as const } },
            { shortName: { contains: query.q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const where = isAdmin
      ? { ...searchFilter }
      : {
          ...searchFilter,
          memberships: {
            some: {
              userId,
              status: 'ACTIVE' as const,
            },
          },
        };

    const [programs, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        include: {
          _count: {
            select: { memberships: true },
          },
        },
        orderBy: { [query.sort || 'createdAt']: query.order || 'desc' },
        ...paginate(query),
      }),
      this.prisma.program.count({ where }),
    ]);

    const data = programs.map((p) => ({
      ...p,
      memberCount: p._count.memberships,
      _count: undefined,
    }));

    return paginatedResponse(data, total, query);
  }

  async findOne(id: string) {
    return this.prisma.program.findUniqueOrThrow({
      where: { id },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    });
  }

  async create(dto: CreateProgramDto) {
    return this.prisma.program.create({
      data: {
        name: dto.name,
        shortName: dto.shortName,
        description: dto.description,
        duration: dto.duration,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status,
      },
    });
  }

  async update(id: string, dto: UpdateProgramDto) {
    return this.prisma.program.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async archive(id: string) {
    return this.prisma.program.update({
      where: { id },
      data: { status: ProgramStatus.ARCHIVED },
    });
  }

  // ─── Attachments ───

  async listAttachments(programId: string) {
    return this.prisma.programAttachment.findMany({
      where: { programId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async uploadAttachment(
    programId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Verify program exists
    await this.prisma.program.findUniqueOrThrow({
      where: { id: programId },
    });

    const ext = file.originalname.split('.').pop() || '';
    const key = `programs/${programId}/${randomUUID()}.${ext}`;

    await this.upload.upload(key, file.buffer, file.mimetype);

    return this.prisma.programAttachment.create({
      data: {
        programId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key,
        uploadedBy: userId,
      },
    });
  }

  async deleteAttachment(programId: string, attachmentId: string) {
    const attachment = await this.prisma.programAttachment.findFirst({
      where: { id: attachmentId, programId },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.upload.delete(attachment.key);
    await this.prisma.programAttachment.delete({
      where: { id: attachmentId },
    });

    return { success: true };
  }

  async downloadAttachment(
    programId: string,
    attachmentId: string,
  ): Promise<{ stream: Readable; attachment: { filename: string; mimeType: string; size: number } }> {
    const attachment = await this.prisma.programAttachment.findFirst({
      where: { id: attachmentId, programId },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const stream = await this.upload.getStream(attachment.key);
    return { stream, attachment };
  }
}
