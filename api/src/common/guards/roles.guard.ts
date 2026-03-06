import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    const programId = request.params.programId;
    if (!programId) {
      // For non-program-scoped routes, check if user has any membership with required role
      const membership = await this.prisma.programMembership.findFirst({
        where: {
          userId: user.id,
          role: { in: requiredRoles },
          status: 'ACTIVE',
        },
      });
      return !!membership;
    }

    const membership = await this.prisma.programMembership.findUnique({
      where: {
        programId_userId: { programId, userId: user.id },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') return false;
    return requiredRoles.includes(membership.role);
  }
}
