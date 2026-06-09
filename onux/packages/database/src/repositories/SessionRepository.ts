import { prisma } from '../client';
import { Session, AuthMethod } from '@prisma/client';
import * as crypto from 'crypto';

export class SessionRepository {
  async findById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { id } });
  }

  async findByJti(jti: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { tokenJti: jti } });
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { refreshTokenHash: hash } });
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        refreshTokenExpiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async create(data: {
    userId: string;
    authMethod: AuthMethod;
    ipAddress: string;
    userAgent?: string;
    deviceName?: string;
    deviceType?: string;
    osName?: string;
    browserName?: string;
    countryCode?: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
  }): Promise<{ session: Session; refreshToken: string; jti: string }> {
    const jti = uuidv4();
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await prisma.session.create({
      data: {
        userId: data.userId,
        tokenJti: jti,
        refreshTokenHash,
        authMethod: data.authMethod,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        osName: data.osName,
        browserName: data.browserName,
        countryCode: data.countryCode,
        accessTokenExpiresAt: data.accessTokenExpiresAt,
        refreshTokenExpiresAt: data.refreshTokenExpiresAt,
      },
    });

    return { session, refreshToken, jti };
  }

  async revoke(sessionId: string, reason?: string): Promise<Session> {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokeReason: reason || 'manual',
      },
    });
  }

  async revokeAllByUserId(userId: string, reason?: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokeReason: reason || 'revoke_all',
      },
    });
    return result.count;
  }

  async updateLastActive(sessionId: string, ipAddress: string): Promise<Session> {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        lastActiveAt: new Date(),
        lastActiveIp: ipAddress,
      },
    });
  }

  async cleanupExpired(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        refreshTokenExpiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return prisma.session.count({
      where: {
        userId,
        isRevoked: false,
        refreshTokenExpiresAt: { gt: new Date() },
      },
    });
  }
}

function uuidv4(): string {
  return crypto.randomUUID();
}

export const sessionRepository = new SessionRepository();
