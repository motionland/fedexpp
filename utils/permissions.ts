type Permission = {
  id: number;
  name: string;
  description: string;
};

type UserRole = {
  id: number;
  name: string;
  permissions: Permission[];
};

type User = {
  id: string;
  username: string;
  role: string;
  roleData?: UserRole;
};

/**
 * Check if a user has a specific permission
 * @param user - The user object
 * @param permissionName - The name of the permission to check
 * @returns boolean - true if user has the permission, false otherwise
 */
export const hasPermission = (
  user: User | null,
  permissionName: string
): boolean => {
  if (!user) return false;

  if (!user.roleData?.permissions) {
    // Fallback: if roleData is not loaded yet, provide basic permissions based on role
    // These should match the actual database permissions
    const basicRolePermissions: Record<string, string[]> = {
      admin: [
        "view_dashboard",
        "manage_users",
        "edit_settings",
        "view_reports",
      ],
      manager: ["view_dashboard", "view_reports"],
      user: ["view_dashboard"],
    };
    return basicRolePermissions[user.role]?.includes(permissionName) || false;
  }

  return user.roleData.permissions.some(
    (permission) => permission.name === permissionName
  );
};

/**
 * Check if a user has any of the specified permissions
 * @param user - The user object
 * @param permissionNames - Array of permission names to check
 * @returns boolean - true if user has at least one of the permissions
 */
export const hasAnyPermission = (
  user: User | null,
  permissionNames: string[]
): boolean => {
  return permissionNames.some((permission) => hasPermission(user, permission));
};

/**
 * Check if a user has all of the specified permissions
 * @param user - The user object
 * @param permissionNames - Array of permission names to check
 * @returns boolean - true if user has all of the permissions
 */
export const hasAllPermissions = (
  user: User | null,
  permissionNames: string[]
): boolean => {
  return permissionNames.every((permission) => hasPermission(user, permission));
};

/**
 * Get all permission names for a user
 * @param user - The user object
 * @returns string[] - Array of permission names
 */
export const getUserPermissions = (user: User | null): string[] => {
  if (!user) return [];

  if (!user.roleData?.permissions) {
    // Fallback: if roleData is not loaded yet, return basic permissions based on role
    // These should match the actual database permissions
    const basicRolePermissions: Record<string, string[]> = {
      admin: [
        "view_dashboard",
        "manage_users",
        "edit_settings",
        "view_reports",
      ],
      manager: ["view_dashboard", "view_reports"],
      user: ["view_dashboard"],
    };
    return basicRolePermissions[user.role] || [];
  }

  return user.roleData.permissions.map((permission) => permission.name);
};
