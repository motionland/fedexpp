import { useAuth } from "@/contexts/AuthContext";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
} from "@/utils/permissions";

/**
 * Custom hook for permission checking
 * Provides easy-to-use permission checking functions
 */
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    /**
     * Check if the current user has a specific permission
     */
    hasPermission: (permissionName: string) =>
      hasPermission(user, permissionName),

    /**
     * Check if the current user has any of the specified permissions
     */
    hasAnyPermission: (permissionNames: string[]) =>
      hasAnyPermission(user, permissionNames),

    /**
     * Check if the current user has all of the specified permissions
     */
    hasAllPermissions: (permissionNames: string[]) =>
      hasAllPermissions(user, permissionNames),

    /**
     * Get all permission names for the current user
     */
    getUserPermissions: () => getUserPermissions(user),

    /**
     * Check if the current user can view reports
     */
    canViewReports: () => hasPermission(user, "view_reports"),

    /**
     * Check if the current user can manage users
     */
    canManageUsers: () => hasPermission(user, "manage_users"),

    /**
     * Check if the current user can edit settings
     */
    canEditSettings: () => hasPermission(user, "edit_settings"),

    /**
     * Check if the current user can view dashboard
     */
    canViewDashboard: () => hasPermission(user, "view_dashboard"),
  };
};
