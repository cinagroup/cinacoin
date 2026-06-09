import { prisma } from '../client';
import { User, UserStatus, GlobalRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByExternalId(externalId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { externalId } });
  }

  async create(data: {
    email: string;
    password?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    status?: UserStatus;
    globalRole?: GlobalRole;
  }): Promise<User> {
    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;
    const passwordSalt = data.password ? await bcrypt.genSalt(12) : null;

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        passwordSalt,
        displayName: data.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status || 'pending',
        globalRole: data.globalRole || 'user',
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || !user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateLastLogin(userId: string, ipAddress: string, userAgent: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        lastLoginUserAgent: userAgent,
        failedLoginAttempts: 0,
      },
    });
  }

  async incrementFailedLogin(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    const failedAttempts = user.failedLoginAttempts + 1;
    const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 min lock

    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: failedAttempts,
        lockedUntil,
      },
    });
  }

  async changePassword(userId: string, newPassword: string): Promise<User> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const passwordSalt = await bcrypt.genSalt(12);

    // Save to password history
    const user = await this.findById(userId);
    if (user?.passwordHash && user.passwordSalt) {
      await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash: user.passwordHash,
          passwordSalt: user.passwordSalt,
        },
      });
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordSalt,
        lastPasswordChange: new Date(),
      },
    });
  }

  async findMany(options?: {
    status?: UserStatus;
    globalRole?: GlobalRole;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        status: options?.status,
        globalRole: options?.globalRole,
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(options?: { status?: UserStatus }): Promise<number> {
    return prisma.user.count({
      where: { status: options?.status },
    });
  }
}

export const userRepository = new UserRepository();
