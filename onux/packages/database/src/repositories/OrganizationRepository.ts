import { prisma } from '../client';
import { Organization, OrgMember, OrgMemberRole } from '@prisma/client';

export class OrganizationRepository {
  async findById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { id },
      include: { owner: true, members: { include: { user: true } } },
    });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { slug } });
  }

  async findByExternalId(externalId: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { externalId } });
  }

  async create(data: {
    name: string;
    slug: string;
    ownerId: string;
    description?: string;
    isPersonal?: boolean;
  }): Promise<Organization> {
    return prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        ownerId: data.ownerId,
        description: data.description,
        isPersonal: data.isPersonal || false,
      },
    });
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return prisma.organization.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findMembersByOrgId(orgId: string): Promise<OrgMember[]> {
    return prisma.orgMember.findMany({
      where: { orgId, isActive: true },
      include: { user: true },
    });
  }

  async addMember(data: {
    orgId: string;
    userId: string;
    role: OrgMemberRole;
    invitedBy?: string;
  }): Promise<OrgMember> {
    return prisma.orgMember.create({
      data: {
        orgId: data.orgId,
        userId: data.userId,
        role: data.role,
        invitedBy: data.invitedBy,
        invitedAt: new Date(),
      },
    });
  }

  async removeMember(orgId: string, userId: string): Promise<OrgMember> {
    return prisma.orgMember.update({
      where: { orgId_userId: { orgId, userId } },
      data: { isActive: false },
    });
  }

  async updateMemberRole(orgId: string, userId: string, role: OrgMemberRole): Promise<OrgMember> {
    return prisma.orgMember.update({
      where: { orgId_userId: { orgId, userId } },
      data: { role },
    });
  }

  async getMember(orgId: string, userId: string): Promise<OrgMember | null> {
    return prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
      include: { user: true },
    });
  }

  async findUserOrgs(userId: string): Promise<Organization[]> {
    const memberships = await prisma.orgMember.findMany({
      where: { userId, isActive: true },
      include: { org: true },
    });
    return memberships.map((m) => m.org);
  }

  async countMembers(orgId: string): Promise<number> {
    return prisma.orgMember.count({
      where: { orgId, isActive: true },
    });
  }
}

export const organizationRepository = new OrganizationRepository();
