import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeekDto, UpdateWeekDto } from './dto/create-week.dto';

@Injectable()
export class WeeksService {
  constructor(private prisma: PrismaService) {}

  async findAll(programId: string) {
    return this.prisma.week.findMany({
      where: { programId },
      orderBy: { weekNo: 'asc' },
      include: {
        _count: {
          select: {
            sessions: true,
            missions: true,
          },
        },
      },
    });
  }

  async create(programId: string, dto: CreateWeekDto) {
    return this.prisma.week.create({
      data: {
        programId,
        weekNo: dto.weekNo,
        title: dto.title,
        goal: dto.goal,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async update(weekId: string, dto: UpdateWeekDto) {
    return this.prisma.week.update({
      where: { id: weekId },
      data: {
        ...(dto.weekNo !== undefined && { weekNo: dto.weekNo }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.goal !== undefined && { goal: dto.goal }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      },
    });
  }

  async publish(weekId: string) {
    return this.prisma.week.update({
      where: { id: weekId },
      data: { status: 'PUBLISHED' },
    });
  }
}
