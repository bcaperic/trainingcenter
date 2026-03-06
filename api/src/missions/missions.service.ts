import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMissionDto, UpdateMissionDto } from './dto/create-mission.dto';

@Injectable()
export class MissionsService {
  constructor(private prisma: PrismaService) {}

  async findByWeek(programId: string, weekId: string, userId?: string) {
    const missions = await this.prisma.mission.findMany({
      where: { programId, weekId },
      include: {
        submissions: userId
          ? { where: { userId }, include: { attachments: true } }
          : false,
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return missions.map((mission) => {
      const { submissions, _count, ...rest } = mission;
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
}
