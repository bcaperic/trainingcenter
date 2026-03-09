import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateMissionDto, UpdateMissionDto } from './dto/create-mission.dto';
import { randomBytes } from 'crypto';
import { extname } from 'path';

@Injectable()
export class MissionsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async findAll(programId: string) {
    return this.prisma.mission.findMany({
      where: { programId },
      include: {
        _count: { select: { submissions: true } },
        attachments: true,
        week: { select: { id: true, weekNo: true, title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByWeek(programId: string, weekId: string, userId?: string) {
    const missions = await this.prisma.mission.findMany({
      where: { programId, weekId },
      include: {
        submissions: userId
          ? { where: { userId }, include: { attachments: true } }
          : false,
        _count: { select: { submissions: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return missions.map((mission) => {
      const { submissions, _count, attachments, ...rest } = mission;
      let userStatus: string | undefined;

      if (userId && Array.isArray(submissions)) {
        const sub = submissions[0];
        if (!sub) {
          userStatus =
            mission.dueAt && new Date(mission.dueAt) < new Date()
              ? 'overdue'
              : 'pending';
        } else if (
          sub.status === 'REVIEWED' ||
          sub.status === 'PASS'
        ) {
          userStatus = 'reviewed';
        } else if (sub.status === 'SUBMITTED') {
          userStatus = 'submitted';
        } else {
          userStatus = 'submitted';
        }
      }

      return {
        ...rest,
        attachments,
        submissionCount: _count.submissions,
        ...(userId && { userStatus }),
        ...(userId && Array.isArray(submissions) && submissions[0] && { userSubmission: submissions[0] }),
      };
    });
  }

  async create(programId: string, dto: CreateMissionDto) {
    return this.prisma.mission.create({
      data: {
        programId,
        weekId: dto.weekId,
        type: dto.type,
        title: dto.title,
        description: dto.description || '',
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
    });
  }

  async update(missionId: string, dto: UpdateMissionDto) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    const data: any = { ...dto };
    if (dto.dueAt) data.dueAt = new Date(dto.dueAt);
    delete data.weekId;

    return this.prisma.mission.update({
      where: { id: missionId },
      data,
    });
  }

  async publish(missionId: string) {
    return this.prisma.mission.update({
      where: { id: missionId },
      data: { status: 'PUBLISHED' },
    });
  }

  // ── Mission Attachments ──

  async listMissionAttachments(missionId: string) {
    return this.prisma.missionAttachment.findMany({
      where: { missionId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async uploadMissionAttachment(missionId: string, file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('No file provided');

    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    const ext = extname(file.originalname) || '';
    const key = `missions/${missionId}/${randomBytes(16).toString('hex')}${ext}`;
    await this.uploadService.upload(key, file.buffer, file.mimetype);

    return this.prisma.missionAttachment.create({
      data: {
        missionId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key,
        uploadedBy: userId,
      },
    });
  }

  async downloadMissionAttachment(missionId: string, attachmentId: string) {
    const attachment = await this.prisma.missionAttachment.findFirst({
      where: { id: attachmentId, missionId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    const stream = await this.uploadService.getStream(attachment.key);
    return { stream, attachment };
  }

  async deleteMissionAttachment(missionId: string, attachmentId: string) {
    const attachment = await this.prisma.missionAttachment.findFirst({
      where: { id: attachmentId, missionId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.prisma.missionAttachment.delete({ where: { id: attachmentId } });
    return { success: true };
  }
}
