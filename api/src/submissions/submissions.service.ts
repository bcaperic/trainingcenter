import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateSubmissionDto, ReviewSubmissionDto } from './dto/create-submission.dto';
import { PaginationQueryDto, paginate, paginatedResponse } from '../common/dto/pagination-query.dto';
import { randomBytes } from 'crypto';
import { extname } from 'path';

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async submit(programId: string, missionId: string, userId: string, dto: CreateSubmissionDto) {
    return this.prisma.submission.upsert({
      where: {
        missionId_userId: { missionId, userId },
      },
      create: {
        programId,
        missionId,
        userId,
        contentText: dto.contentText,
        contentUrl: dto.contentUrl,
        status: 'SUBMITTED',
      },
      update: {
        contentText: dto.contentText,
        contentUrl: dto.contentUrl,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
  }

  async submitWithFile(
    programId: string,
    missionId: string,
    userId: string,
    dto: CreateSubmissionDto,
    file?: Express.Multer.File,
  ) {
    const submission = await this.prisma.submission.upsert({
      where: {
        missionId_userId: { missionId, userId },
      },
      create: {
        programId,
        missionId,
        userId,
        contentText: dto.contentText || null,
        contentUrl: dto.contentUrl || null,
        status: 'SUBMITTED',
      },
      update: {
        contentText: dto.contentText || null,
        contentUrl: dto.contentUrl || null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    if (file) {
      const ext = extname(file.originalname) || '';
      const key = `submissions/${submission.id}/${randomBytes(16).toString('hex')}${ext}`;
      await this.uploadService.upload(key, file.buffer, file.mimetype);

      await this.prisma.submissionAttachment.create({
        data: {
          submissionId: submission.id,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          key,
        },
      });
    }

    return this.prisma.submission.findUnique({
      where: { id: submission.id },
      include: { attachments: true },
    });
  }

  async listAttachments(submissionId: string) {
    return this.prisma.submissionAttachment.findMany({
      where: { submissionId },
      orderBy: { uploadedAt: 'asc' },
    });
  }

  async downloadAttachment(attachmentId: string) {
    const attachment = await this.prisma.submissionAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    const stream = await this.uploadService.getStream(attachment.key);
    return { stream, attachment };
  }

  async findByMission(programId: string, missionId: string, query: PaginationQueryDto) {
    const where = { programId, missionId };
    const [data, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          attachments: true,
        },
        orderBy: { submittedAt: 'desc' },
        ...paginate(query),
      }),
      this.prisma.submission.count({ where }),
    ]);
    return paginatedResponse(data, total, query);
  }

  async findMySubmissions(programId: string, userId: string, query: PaginationQueryDto) {
    const where = { programId, userId };
    const [data, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        include: {
          mission: {
            select: { id: true, title: true, type: true, weekId: true, dueAt: true },
          },
          attachments: true,
        },
        orderBy: { submittedAt: 'desc' },
        ...paginate(query),
      }),
      this.prisma.submission.count({ where }),
    ]);
    return paginatedResponse(data, total, query);
  }

  async review(submissionId: string, dto: ReviewSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException('Submission not found');

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: dto.status,
        score: dto.score,
        feedback: dto.feedback,
        reviewedAt: new Date(),
      },
    });
  }
}
