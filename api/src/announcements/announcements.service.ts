import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';
import {
  PaginationQueryDto,
  paginate,
  paginatedResponse,
} from '../common/dto/pagination-query.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(programId: string, query: PaginationQueryDto) {
    const searchFilter = query.q
      ? { title: { contains: query.q, mode: 'insensitive' as const } }
      : {};

    const where = {
      programId,
      ...searchFilter,
    };

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        ...paginate(query),
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return paginatedResponse(announcements, total, query);
  }

  async create(programId: string, authorId: string, dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        programId,
        authorId,
        title: dto.title,
        body: dto.body,
        isPinned: dto.isPinned ?? false,
        status: 'DRAFT',
      },
    });
  }

  async update(announcementId: string, dto: UpdateAnnouncementDto) {
    return this.prisma.announcement.update({
      where: { id: announcementId },
      data: dto,
    });
  }

  async publish(announcementId: string) {
    const announcement = await this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    // Find all active trainees in the program
    const memberships = await this.prisma.programMembership.findMany({
      where: {
        programId: announcement.programId,
        role: 'TRAINEE',
        status: 'ACTIVE',
      },
      select: { userId: true },
    });

    // Create notifications for all trainees
    if (memberships.length > 0) {
      await this.prisma.notification.createMany({
        data: memberships.map((m) => ({
          programId: announcement.programId,
          userId: m.userId,
          type: 'ANNOUNCEMENT' as const,
          title: announcement.title,
          body: '',
          linkPath: '/learn/announcements',
        })),
      });
    }

    return announcement;
  }
}
