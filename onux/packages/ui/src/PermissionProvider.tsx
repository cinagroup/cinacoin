import { createContext, useContext, type ReactNode } from 'react';

// ─── Permission Types ─────────────────────────────────────────────────────────

export type Permission =
  // Dashboard permissions
  | 'dashboard:view'
  | 'dashboard:admin'
  // Service permissions
  | 'services:view'
  | 'services:manage'
  | 'services:deploy'
  // Project permissions
  | 'projects:view'
  | 'projects:create'
  | 'projects:edit'
  | 'projects:delete'
  // API Key permissions
  | 'apikeys:view'
  | 'apikeys:create'
  | 'apikeys:revoke'
  // Analytics permissions
  | 'analytics:view'
  | 'analytics:export'
  // Settings permissions
  | 'settings:view'
  | 'settings:manage'
  // User management
  | 'users:view'
  | 'users:manage';

export type Role = 'admin' | 'developer' | 'viewer' | 'service';

export interface PermissionContextValue {
  /** Current user's role */
  role: Role | null;
  /** Current user's explicit permissions */
  permissions: Permission[];
  /** Check if user has a specific permission */
  hasPermission: (permission: Permission) => boolean;
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: Permission[]) => boolean;
  /** Check if user has all of the specified permissions */
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  role: null,
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
});

export function usePermissions() {
  return useContext(PermissionContext);
}

// ─── Role-based Permission Mapping ────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'dashboard:view',
    'dashboard:admin',
    'services:view',
    'services:manage',
    'services:deploy',
    'projects:view',
    'projects:create',
    'projects:edit',
    'projects:delete',
    'apikeys:view',
    'apikeys:create',
    'apikeys:revoke',
    'analytics:view',
    'analytics:export',
    'settings:view',
    'settings:manage',
    'users:view',
    'users:manage',
  ],
  developer: [
    'dashboard:view',
    'services:view',
    'projects:view',
    'projects:create',
    'projects:edit',
    'apikeys:view',
    'apikeys:create',
    'apikeys:revoke',
    'analytics:view',
    'settings:view',
  ],
  viewer: [
    'dashboard:view',
    'services:view',
    'projects:view',
    'apikeys:view',
    'analytics:view',
    'settings:view',
  ],
  service: [
    'services:view',
    'services:manage',
  ],
};

/**
 * Get default permissions for a role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// ─── Permission Provider ──────────────────────────────────────────────────────

export interface PermissionProviderProps {
  children: ReactNode;
  /** User's role (used to derive default permissions) */
  role?: Role | null;
  /** Explicit permissions (overrides role-based defaults) */
  permissions?: Permission[];
}

/**
 * PermissionProvider — manages user permissions with role-based defaults.
 *
 * Usage:
 * ```tsx
 * <PermissionProvider role="admin">
 *   <App />
 * </PermissionProvider>
 * ```
 */
export function PermissionProvider({
  children,
  role = null,
  permissions: explicitPermissions,
}: PermissionProviderProps) {
  // Use explicit permissions if provided, otherwise derive from role
  const permissions = explicitPermissions || (role ? getPermissionsForRole(role) : []);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  return (
    <PermissionContext.Provider
      value={{
        role,
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

// ─── Permission Guard Component ───────────────────────────────────────────────

export interface PermissionGuardProps {
  children: ReactNode;
  /** Required permission to render children */
  permission?: Permission;
  /** Any of these permissions required */
  anyOf?: Permission[];
  /** All of these permissions required */
  allOf?: Permission[];
  /** Fallback content when permission check fails */
  fallback?: ReactNode;
}

/**
 * PermissionGuard — conditionally renders children based on permissions.
 *
 * Usage:
 * ```tsx
 * <PermissionGuard permission="projects:create">
 *   <CreateProjectButton />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let allowed = true;

  if (permission && !hasPermission(permission)) {
    allowed = false;
  }

  if (anyOf && !hasAnyPermission(anyOf)) {
    allowed = false;
  }

  if (allOf && !hasAllPermissions(allOf)) {
    allowed = false;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
