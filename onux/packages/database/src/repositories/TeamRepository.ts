import { prisma } from '../client';
import { Team, TeamMember } from '@prisma/client';

export class TeamRepository {
  async findById(id: string): Promise<Team | null> {
    return prisma.team.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    });
  }

  async findByOrgAndSlug(orgId: string, slug: string): Promise<Team | null> {
    return prisma.team.findUnique({
      where: { orgId_slug: { orgId, slug } },
    });
  }

  async create(data: {
    orgId: string;
    name: string;
    slug: string;
    description?: string;
    createdBy?: string;
  }): Promise<Team> {
    return prisma.team.create({
      data: {
        orgId: data.orgId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        createdBy: data.createdBy,
      },
    });
  }

  async update(id: string, data: Partial<Team>): Promise<Team> {
    return prisma.team.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Team> {
    return prisma.team.delete({ where: { id } });
  }

  async findTeamsByOrgId(orgId: string): Promise<Team[]> {
    return prisma.team.findMany({
      where: { orgId },
      include: { _count: { select: { members: true } } },
    });
  }

  async addMember(data: {
    teamId: string;
    userId: string;
    role?: string;
  }): Promise<TeamMember> {
    return prisma.teamMember.create({
      data: {
        teamId: data.teamId,
        userId: data.userId,
        role: data.role || 'member',
      },
    });
  }

  async removeMember(teamId: string, userId: string): Promise<TeamMember> {
    return prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId } },
      data: { isActive: false },
    });
  }

  async getMember(teamId: string, userId: string): Promise<TeamMember | null> {
    return prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  async findMembersByTeamId(teamId: string): Promise<TeamMember[]> {
    return prisma.teamMember.findMany({
      where: { teamId, isActive: true },
      include: { user: true },
    });
  }

  async findUserTeams(userId: string): Promise<Team[]> {
    const memberships = await prisma.teamMember.findMany({
      where: { userId, isActive: true },
      include: { team: true },
    });
    return memberships.map((m) => m.team);
  }
}

export const teamRepository = new TeamRepository();
