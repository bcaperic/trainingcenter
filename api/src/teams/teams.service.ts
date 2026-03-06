import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(programId: string) {
    const teams = await this.prisma.team.findMany({
      where: { programId },
      include: {
        lead: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return teams.map((team) => ({
      ...team,
      memberCount: team._count.memberships,
      _count: undefined,
    }));
  }

  async create(programId: string, dto: CreateTeamDto) {
    return this.prisma.team.create({
      data: {
        programId,
        name: dto.name,
        leadUserId: dto.leadUserId,
      },
      include: {
        lead: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async update(teamId: string, dto: UpdateTeamDto) {
    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        name: dto.name,
        leadUserId: dto.leadUserId,
      },
      include: {
        lead: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
