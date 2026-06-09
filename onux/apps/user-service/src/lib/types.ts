/**
 * User Service Types
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserStatus = 'pending' | 'active' | 'suspended' | 'disabled' | 'deleted';

export interface UserRecord {
  id: string;
  external_id: string;
  email: string;
  email_verified: boolean;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  locale: string;
  timezone: string;
  status: UserStatus;
  last_login_at: string | null;
  last_login_ip: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  externalId: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  locale: string;
  timezone: string;
  status: UserStatus;
  lastLoginAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function toPublicUser(record: UserRecord): PublicUser {
  return {
    id: record.id,
    externalId: record.external_id,
    email: record.email,
    emailVerified: record.email_verified,
    displayName: record.display_name,
    firstName: record.first_name,
    lastName: record.last_name,
    avatarUrl: record.avatar_url,
    locale: record.locale,
    timezone: record.timezone,
    status: record.status,
    lastLoginAt: record.last_login_at,
    metadata: record.metadata,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

// ============================================================================
// TEAM TYPES
// ============================================================================

export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamRecord {
  id: string;
  external_id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PublicTeam {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  createdBy: string | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function toPublicTeam(record: TeamRecord): PublicTeam {
  return {
    id: record.id,
    externalId: record.external_id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    avatarUrl: record.avatar_url,
    createdBy: record.created_by,
    isActive: record.is_active,
    metadata: record.metadata,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

// ============================================================================
// TEAM MEMBER TYPES
// ============================================================================

export interface TeamMemberRecord {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  is_active: boolean;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface PublicTeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  isActive: boolean;
  invitedBy: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export function toPublicTeamMember(record: TeamMemberRecord): PublicTeamMember {
  return {
    id: record.id,
    teamId: record.team_id,
    userId: record.user_id,
    role: record.role,
    isActive: record.is_active,
    invitedBy: record.invited_by,
    joinedAt: record.joined_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface PermissionRecord {
  id: string;
  resource: string;
  action: string;
  qualifier: string | null;
  description: string | null;
  permission_key: string;
  created_at: string;
}

export interface UserPermissionRecord {
  id: string;
  user_id: string;
  permission_id: string;
  is_deny: boolean;
  team_id: string | null;
  resource_id: string | null;
  granted_by: string | null;
  expires_at: string | null;
  created_at: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  error: string;
  message: string;
  details?: string[];
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// REQUEST CONTEXT
// ============================================================================

export interface RequestContext {
  requestId: string;
  userId?: string;
  serviceAuth?: boolean;
}
