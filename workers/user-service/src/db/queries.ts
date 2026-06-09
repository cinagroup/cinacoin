/**
 * D1 Database Query Functions
 * All data access for the User Service.
 */

import type {
  User,
  Team,
  TeamMember,
  Permission,
  ApiKey,
  CreateUserInput,
  UpdateUserInput,
  CreateTeamInput,
  UpdateTeamInput,
  AddTeamMemberInput,
  GrantPermissionInput,
  CreateApiKeyInput,
  Env,
  TeamRole,
} from './schema';

import {
  cacheGet,
  cacheSet,
  cacheInvalidate,
  invalidateUser,
  invalidateTeam,
  invalidatePermissions,
  TTL,
  PREFIX,
} from './cache';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function generateId(): string {
  // Simple unique ID — in production prefer nanoid or crypto.randomUUID()
  return crypto.randomUUID();
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(
  db: D1Database,
  opts: { limit?: number; offset?: number; status?: string } = {},
  kv?: KVNamespace
): Promise<User[]> {
  const { limit = 50, offset = 0, status } = opts;

  // Cache paginated list results with short TTL
  const cacheKey = `users:list:${status ?? 'all'}:${limit}:${offset}`;
  if (kv) {
    const cached = await cacheGet<User[]>(kv, cacheKey);
    if (cached) return cached;
  }

  let sql = 'SELECT * FROM users';
  const params: (string | number)[] = [];

  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await db.prepare(sql).bind(...params).all<User>();

  if (kv) {
    await cacheSet(kv, cacheKey, results, TTL.SHORT);
  }

  return results;
}

export async function getUserById(db: D1Database, id: string, kv?: KVNamespace): Promise<User | null> {
  // Try cache first
  if (kv) {
    const cached = await cacheGet<User>(kv, `${PREFIX.USER_ID}${id}`);
    if (cached) return cached;
  }

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();

  // Cache the result
  if (kv && user) {
    await cacheSet(kv, `${PREFIX.USER_ID}${id}`, user, TTL.MEDIUM);
  }

  return user;
}

export async function getUserByEmail(db: D1Database, email: string, kv?: KVNamespace): Promise<User | null> {
  // Try cache first
  if (kv) {
    const cached = await cacheGet<User>(kv, `${PREFIX.USER_EMAIL}${email}`);
    if (cached) return cached;
  }

  const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();

  // Cache the result
  if (kv && user) {
    await cacheSet(kv, `${PREFIX.USER_EMAIL}${email}`, user, TTL.MEDIUM);
  }

  return user;
}

export async function getUserByUsername(db: D1Database, username: string, kv?: KVNamespace): Promise<User | null> {
  // Try cache first
  if (kv) {
    const cached = await cacheGet<User>(kv, `${PREFIX.USER_USERNAME}${username}`);
    if (cached) return cached;
  }

  const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<User>();

  // Cache the result
  if (kv && user) {
    await cacheSet(kv, `${PREFIX.USER_USERNAME}${username}`, user, TTL.MEDIUM);
  }

  return user;
}

export async function createUser(db: D1Database, input: CreateUserInput, kv?: KVNamespace): Promise<User> {
  const id = generateId();
  const ts = now();
  await db
    .prepare(
      `INSERT INTO users (id, email, username, display_name, avatar_url, auth_type, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
    .bind(id, input.email, input.username ?? null, input.display_name ?? null, input.avatar_url ?? null, input.auth_type, ts, ts)
    .run();

  return (await getUserById(db, id, kv))!;
}

export async function updateUser(
  db: D1Database,
  id: string,
  input: UpdateUserInput,
  kv?: KVNamespace
): Promise<User | null> {
  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  if (input.username !== undefined) {
    sets.push('username = ?');
    params.push(input.username);
  }
  if (input.display_name !== undefined) {
    sets.push('display_name = ?');
    params.push(input.display_name);
  }
  if (input.avatar_url !== undefined) {
    sets.push('avatar_url = ?');
    params.push(input.avatar_url);
  }
  if (input.status !== undefined) {
    sets.push('status = ?');
    params.push(input.status);
  }

  if (sets.length === 0) return getUserById(db, id, kv);

  sets.push('updated_at = ?');
  params.push(now());
  params.push(id);

  await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run();

  // Invalidate old cache entries (we need to fetch old user first to know email/username)
  if (kv) {
    const oldUser = await db.prepare('SELECT email, username FROM users WHERE id = ?').bind(id).first<{ email: string; username: string | null }>();
    if (oldUser) {
      await invalidateUser(kv, id, oldUser.email, oldUser.username ?? undefined);
    }
  }

  return getUserById(db, id, kv);
}

export async function deleteUser(db: D1Database, id: string, kv?: KVNamespace): Promise<boolean> {
  // Fetch user before deletion for cache invalidation
  let email: string | undefined;
  let username: string | undefined;
  if (kv) {
    const user = await db.prepare('SELECT email, username FROM users WHERE id = ?').bind(id).first<{ email: string; username: string | null }>();
    if (user) {
      email = user.email;
      username = user.username ?? undefined;
    }
  }

  const { meta } = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

  // Invalidate cache
  if (kv && email) {
    await invalidateUser(kv, id, email, username);
  }

  return (meta.changes ?? 0) > 0;
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function listTeams(db: D1Database, opts: { limit?: number; offset?: number } = {}, kv?: KVNamespace): Promise<Team[]> {
  const { limit = 50, offset = 0 } = opts;

  // Cache paginated list results with short TTL
  const cacheKey = `teams:list:${limit}:${offset}`;
  if (kv) {
    const cached = await cacheGet<Team[]>(kv, cacheKey);
    if (cached) return cached;
  }

  const { results } = await db
    .prepare('SELECT * FROM teams ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<Team>();

  if (kv) {
    await cacheSet(kv, cacheKey, results, TTL.SHORT);
  }

  return results;
}

export async function getTeamById(db: D1Database, id: string, kv?: KVNamespace): Promise<Team | null> {
  // Try cache first
  if (kv) {
    const cached = await cacheGet<Team>(kv, `${PREFIX.TEAM_ID}${id}`);
    if (cached) return cached;
  }

  const team = await db.prepare('SELECT * FROM teams WHERE id = ?').bind(id).first<Team>();

  // Cache the result
  if (kv && team) {
    await cacheSet(kv, `${PREFIX.TEAM_ID}${id}`, team, TTL.MEDIUM);
  }

  return team;
}

export async function createTeam(db: D1Database, input: CreateTeamInput, kv?: KVNamespace): Promise<Team> {
  const id = generateId();
  const ts = now();

  // Insert team and add owner as member in a batch
  const insertTeam = db
    .prepare(
      `INSERT INTO teams (id, name, description, owner_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, input.name, input.description ?? null, input.owner_id, ts);

  const insertMember = db
    .prepare(
      `INSERT INTO team_members (team_id, user_id, role, joined_at)
       VALUES (?, ?, 'owner', ?)`
    )
    .bind(id, input.owner_id, ts);

  await db.batch([insertTeam, insertMember]);
  return (await getTeamById(db, id, kv))!;
}

export async function updateTeam(
  db: D1Database,
  id: string,
  input: UpdateTeamInput,
  kv?: KVNamespace
): Promise<Team | null> {
  const sets: string[] = [];
  const params: (string | null)[] = [];

  if (input.name !== undefined) {
    sets.push('name = ?');
    params.push(input.name);
  }
  if (input.description !== undefined) {
    sets.push('description = ?');
    params.push(input.description);
  }

  if (sets.length === 0) return getTeamById(db, id, kv);

  params.push(id);
  await db.prepare(`UPDATE teams SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run();

  // Invalidate team cache
  if (kv) {
    await invalidateTeam(kv, id);
  }

  return getTeamById(db, id, kv);
}

export async function deleteTeam(db: D1Database, id: string, kv?: KVNamespace): Promise<boolean> {
  // Cascade: remove members and permissions first
  const removeMembers = db.prepare('DELETE FROM team_members WHERE team_id = ?').bind(id);
  const removePerms = db.prepare('DELETE FROM permissions WHERE team_id = ?').bind(id);
  const removeTeam = db.prepare('DELETE FROM teams WHERE id = ?').bind(id);

  const results = await db.batch([removeMembers, removePerms, removeTeam]);

  // Invalidate team cache
  if (kv) {
    await invalidateTeam(kv, id);
  }

  return (results[2].meta.changes ?? 0) > 0;
}

// ─── Team Members ─────────────────────────────────────────────────────────────

export async function getTeamMembers(
  db: D1Database,
  teamId: string,
  kv?: KVNamespace
): Promise<(TeamMember & { user: User })[]> {
  // Try cache first
  if (kv) {
    const cached = await cacheGet<(TeamMember & { user: User })[]>(kv, `${PREFIX.TEAM_MEMBERS}${teamId}`);
    if (cached) return cached;
  }

  const { results } = await db
    .prepare(
      `SELECT tm.team_id, tm.user_id, tm.role, tm.joined_at,
              u.id as u_id, u.email, u.username, u.display_name, u.avatar_url,
              u.auth_type, u.status, u.created_at as u_created_at, u.updated_at as u_updated_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = ?
       ORDER BY tm.joined_at ASC`
    )
    .bind(teamId)
    .all<any>();

  const members = results.map((row: any) => ({
    team_id: row.team_id,
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    user: {
      id: row.u_id,
      email: row.email,
      username: row.username,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      auth_type: row.auth_type,
      status: row.status,
      created_at: row.u_created_at,
      updated_at: row.u_updated_at,
    },
  }));

  // Cache the result
  if (kv) {
    await cacheSet(kv, `${PREFIX.TEAM_MEMBERS}${teamId}`, members, TTL.SHORT);
  }

  return members;
}

export async function addTeamMember(
  db: D1Database,
  teamId: string,
  input: AddTeamMemberInput,
  kv?: KVNamespace
): Promise<TeamMember> {
  const ts = now();
  await db
    .prepare(
      `INSERT INTO team_members (team_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(teamId, input.user_id, input.role, ts)
    .run();

  // Invalidate team members cache
  if (kv) {
    await invalidateTeam(kv, teamId);
  }

  return {
    team_id: teamId,
    user_id: input.user_id,
    role: input.role,
    joined_at: ts,
  };
}

export async function updateTeamMemberRole(
  db: D1Database,
  teamId: string,
  userId: string,
  role: TeamRole,
  kv?: KVNamespace
): Promise<boolean> {
  const { meta } = await db
    .prepare('UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?')
    .bind(role, teamId, userId)
    .run();

  // Invalidate team members cache
  if (kv) {
    await invalidateTeam(kv, teamId);
  }

  return (meta.changes ?? 0) > 0;
}

export async function removeTeamMember(
  db: D1Database,
  teamId: string,
  userId: string,
  kv?: KVNamespace
): Promise<boolean> {
  const { meta } = await db
    .prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?')
    .bind(teamId, userId)
    .run();

  // Invalidate team members cache
  if (kv) {
    await invalidateTeam(kv, teamId);
  }

  return (meta.changes ?? 0) > 0;
}

export async function getTeamMember(
  db: D1Database,
  teamId: string,
  userId: string,
  kv?: KVNamespace
): Promise<TeamMember | null> {
  // Try cache first (cache the full team members list, then find)
  if (kv) {
    const members = await cacheGet<(TeamMember & { user: User })[]>(kv, `${PREFIX.TEAM_MEMBERS}${teamId}`);
    if (members) {
      return members.find((m) => m.user_id === userId) ?? null;
    }
  }

  return db
    .prepare('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?')
    .bind(teamId, userId)
    .first<TeamMember>();
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function listPermissions(
  db: D1Database,
  filter: { user_id?: string; team_id?: string } = {}
): Promise<Permission[]> {
  const conditions: string[] = [];
  const params: string[] = [];

  if (filter.user_id) {
    conditions.push('user_id = ?');
    params.push(filter.user_id);
  }
  if (filter.team_id) {
    conditions.push('team_id = ?');
    params.push(filter.team_id);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { results } = await db
    .prepare(`SELECT * FROM permissions ${where} ORDER BY granted_at DESC`)
    .bind(...params)
    .all<Permission>();
  return results;
}

export async function grantPermission(
  db: D1Database,
  input: GrantPermissionInput,
  kv?: KVNamespace
): Promise<Permission> {
  const id = generateId();
  const ts = now();
  await db
    .prepare(
      `INSERT INTO permissions (id, user_id, team_id, resource, action, granted_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.user_id ?? null, input.team_id ?? null, input.resource, input.action, ts)
    .run();

  // Invalidate permission check cache for affected user/team
  if (kv) {
    if (input.user_id) {
      await invalidatePermissions(kv, input.user_id);
    }
    if (input.team_id) {
      // Invalidate team cache since permissions changed
      await invalidateTeam(kv, input.team_id);
    }
  }

  return {
    id,
    user_id: input.user_id ?? null,
    team_id: input.team_id ?? null,
    resource: input.resource,
    action: input.action,
    granted_at: ts,
  };
}

export async function revokePermission(db: D1Database, id: string, kv?: KVNamespace): Promise<boolean> {
  // Fetch permission before deletion for cache invalidation
  let userId: string | undefined;
  let teamId: string | undefined;
  if (kv) {
    const perm = await db.prepare('SELECT user_id, team_id FROM permissions WHERE id = ?').bind(id).first<{ user_id: string | null; team_id: string | null }>();
    if (perm) {
      userId = perm.user_id ?? undefined;
      teamId = perm.team_id ?? undefined;
    }
  }

  const { meta } = await db.prepare('DELETE FROM permissions WHERE id = ?').bind(id).run();

  // Invalidate permission check cache
  if (kv) {
    if (userId) {
      await invalidatePermissions(kv, userId);
    }
    if (teamId) {
      await invalidateTeam(kv, teamId);
    }
  }

  return (meta.changes ?? 0) > 0;
}

export async function checkPermission(
  db: D1Database,
  userId: string,
  resource: string,
  action: string,
  teamId?: string,
  kv?: KVNamespace
): Promise<boolean> {
  // Try cache first
  const cacheKey = `${PREFIX.PERMISSION_CHECK}${userId}:${resource}:${action}:${teamId ?? 'null'}`;
  if (kv) {
    const cached = await cacheGet<boolean>(kv, cacheKey);
    if (cached !== null) return cached;
  }

  // Check user-level permission OR team-level permission
  let sql = `SELECT COUNT(*) as cnt FROM permissions
             WHERE resource = ? AND action = ?
             AND (user_id = ?`;
  const params: (string | null)[] = [resource, action, userId];

  if (teamId) {
    sql += ' OR team_id = ?)';
    params.push(teamId);
  } else {
    sql += ')';
  }

  const row = await db.prepare(sql).bind(...params).first<{ cnt: number }>();
  const result = (row?.cnt ?? 0) > 0;

  // Cache the result with short TTL
  if (kv) {
    await cacheSet(kv, cacheKey, result, TTL.SHORT);
  }

  return result;
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export async function listApiKeys(db: D1Database, userId: string): Promise<ApiKey[]> {
  const { results } = await db
    .prepare('SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all<ApiKey>();
  return results;
}

export async function getApiKeyById(db: D1Database, id: string, kv?: KVNamespace): Promise<ApiKey | null> {
  // For simplicity, API keys by ID are not cached (only by hash is hot path)
  // This avoids cache invalidation complexity for a rarely-used lookup
  return db.prepare('SELECT * FROM api_keys WHERE id = ?').bind(id).first<ApiKey>();
}

export async function getApiKeyByHash(db: D1Database, keyHash: string, kv?: KVNamespace): Promise<ApiKey | null> {
  // Try cache first (API keys are frequently looked up for auth)
  if (kv) {
    const cached = await cacheGet<ApiKey>(kv, `${PREFIX.API_KEY_HASH}${keyHash}`);
    if (cached) return cached;
  }

  const apiKey = await db.prepare('SELECT * FROM api_keys WHERE key_hash = ?').bind(keyHash).first<ApiKey>();

  // Cache the result with longer TTL (API keys don't change often)
  if (kv && apiKey) {
    await cacheSet(kv, `${PREFIX.API_KEY_HASH}${keyHash}`, apiKey, TTL.LONG);
  }

  return apiKey;
}

export async function createApiKey(
  db: D1Database,
  input: CreateApiKeyInput & { key_hash: string },
  kv?: KVNamespace
): Promise<ApiKey> {
  const id = generateId();
  const ts = now();
  const scopesJson = JSON.stringify(input.scopes);

  await db
    .prepare(
      `INSERT INTO api_keys (id, user_id, name, key_hash, scopes, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.user_id, input.name, input.key_hash, scopesJson, input.expires_at ?? null, ts)
    .run();

  return (await getApiKeyById(db, id, kv))!;
}

export async function deleteApiKey(db: D1Database, id: string, kv?: KVNamespace): Promise<boolean> {
  // Fetch API key before deletion for cache invalidation
  let keyHash: string | undefined;
  if (kv) {
    const apiKey = await db.prepare('SELECT key_hash FROM api_keys WHERE id = ?').bind(id).first<{ key_hash: string }>();
    if (apiKey) {
      keyHash = apiKey.key_hash;
    }
  }

  const { meta } = await db.prepare('DELETE FROM api_keys WHERE id = ?').bind(id).run();

  // Invalidate cache
  if (kv && keyHash) {
    await cacheInvalidate(kv, `${PREFIX.API_KEY_HASH}${keyHash}`);
  }

  return (meta.changes ?? 0) > 0;
}

export async function deleteApiKeyByUser(
  db: D1Database,
  id: string,
  userId: string,
  kv?: KVNamespace
): Promise<boolean> {
  // Fetch API key before deletion for cache invalidation
  let keyHash: string | undefined;
  if (kv) {
    const apiKey = await db.prepare('SELECT key_hash FROM api_keys WHERE id = ? AND user_id = ?').bind(id, userId).first<{ key_hash: string }>();
    if (apiKey) {
      keyHash = apiKey.key_hash;
    }
  }

  const { meta } = await db
    .prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();

  // Invalidate cache
  if (kv && keyHash) {
    await cacheInvalidate(kv, `${PREFIX.API_KEY_HASH}${keyHash}`);
  }

  return (meta.changes ?? 0) > 0;
}
