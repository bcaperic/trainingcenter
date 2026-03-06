import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteUserDto, UpdateMembershipDto } from './dto/invite-user.dto';
import {
  PaginationQueryDto,
  paginate,
  paginatedResponse,
} from '../common/dto/pagination-query.dto';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async findAll(programId: string, query: PaginationQueryDto) {
    const searchFilter = query.q
      ? {
          user: {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' as const } },
              { email: { contains: query.q, mode: 'insensitive' as const } },
            ],
          },
        }
      : {};

    const where = {
      programId,
      ...searchFilter,
    };

    const [memberships, total] = await Promise.all([
      this.prisma.programMembership.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: query.order || 'desc' },
        ...paginate(query),
      }),
      this.prisma.programMembership.count({ where }),
    ]);

    return paginatedResponse(memberships, total, query);
  }

  async invite(programId: string, dto: InviteUserDto) {
    // Find or create user by email
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    let isNewUser = false;

    if (!user) {
      const randomPassword = randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const resetToken = randomBytes(32).toString('hex');
      const resetExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash,
          status: UserStatus.INVITED,
          resetToken,
          resetExpiresAt,
        },
      });

      // Create MailLog so admin/dev can see the invite link
      const linkUrl = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
      await this.prisma.mailLog.create({
        data: {
          to: dto.email,
          type: 'PASSWORD_RESET',
          subject: 'You have been invited to Training Hub',
          body: `Hi ${dto.name},\n\nYou have been invited to Training Hub. Set your password here: ${linkUrl}\n\nThis link expires in 7 days.`,
          token: resetToken,
          linkUrl,
        },
      });

      console.log(`[DEV MAIL] Invite for ${dto.email}: ${linkUrl}`);
      isNewUser = true;
    }

    // Check if membership already exists
    const existing = await this.prisma.programMembership.findUnique({
      where: { programId_userId: { programId, userId: user.id } },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this program');
    }

    // Create ProgramMembership
    const membership = await this.prisma.programMembership.create({
      data: {
        programId,
        userId: user.id,
        role: dto.role,
        teamId: dto.teamId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return membership;
  }

  async update(programId: string, userId: string, dto: UpdateMembershipDto) {
    return this.prisma.programMembership.update({
      where: {
        programId_userId: { programId, userId },
      },
      data: {
        role: dto.role,
        teamId: dto.teamId,
        status: dto.status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
