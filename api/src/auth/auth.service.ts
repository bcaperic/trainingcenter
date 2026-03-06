import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { getPolicyConfig } from '../common/config/policy.config';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        status: 'INVITED',
        emailVerified: false,
        verifyToken,
        verifyExpiresAt,
      },
    });

    const linkUrl = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/verify-email?token=${verifyToken}`;

    await this.prisma.mailLog.create({
      data: {
        to: email,
        type: 'EMAIL_VERIFY',
        subject: 'Verify your Training Hub account',
        body: `Hi ${name},\n\nClick to verify: ${linkUrl}\n\nThis link expires in 24 hours.`,
        token: verifyToken,
        linkUrl,
      },
    });

    console.log(`[DEV MAIL] Verify email for ${email}: ${linkUrl}`);

    return { message: 'Registration successful. Check your email to verify.' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.verifyExpiresAt && user.verifyExpiresAt < new Date()) {
      throw new BadRequestException('Verification token expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        emailVerified: true,
        verifyToken: null,
        verifyExpiresAt: null,
      },
    });

    return { message: 'Email verified. You can now log in.' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1h

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpiresAt },
    });

    const linkUrl = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

    await this.prisma.mailLog.create({
      data: {
        to: email,
        type: 'PASSWORD_RESET',
        subject: 'Reset your Training Hub password',
        body: `Hi ${user.name},\n\nClick to reset: ${linkUrl}\n\nThis link expires in 1 hour.`,
        token: resetToken,
        linkUrl,
      },
    });

    console.log(`[DEV MAIL] Reset password for ${email}: ${linkUrl}`);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.resetExpiresAt && user.resetExpiresAt < new Date()) {
      throw new BadRequestException('Reset token expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpiresAt: null,
        // Activate invited users when they set their password
        ...(user.status === 'INVITED'
          ? { status: 'ACTIVE' as const, emailVerified: true }
          : {}),
      },
    });

    return { message: 'Password reset successful. You can now log in.' };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      this.SALT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      this.SALT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        memberships: {
          select: {
            id: true,
            role: true,
            teamId: true,
            status: true,
            program: {
              select: {
                id: true,
                name: true,
                shortName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async getMailLogs() {
    return this.prisma.mailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async generateTokens(userId: string, email: string) {
    const config = getPolicyConfig();
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: config.jwtExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: config.jwtRefreshExpiration,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
