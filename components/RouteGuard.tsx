"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type React from "react";

type RouteGuardProps = {
  children: React.ReactNode;
  // New permission-based props
  requiredPermissions?: string[];
  requireAllPermissions?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  // Legacy role-based props (deprecated but kept for backwards compatibility)
  allowedRoles?: ("admin" | "manager" | "user" | "warehouse")[];
};

export function RouteGuard({
  children,
  requiredPermissions,
  requireAllPermissions = false,
  allowedRoles, // Legacy support
}: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isLoading) return; // Wait until auth initialization is complete

    if (!user) {
      router.replace("/login");
      return;
    }

    // Permission-based authorization (preferred)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAccess = requireAllPermissions
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);

      if (!hasAccess) {
        router.replace("/dashboard/unauthorized");
        return;
      }
    }
    // Legacy role-based authorization (fallback)
    else if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role as any)) {
        router.replace("/dashboard/unauthorized");
        return;
      }
    }

    setIsVerified(true);
  }, [
    user,
    isLoading,
    router,
    requiredPermissions,
    requireAllPermissions,
    allowedRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  ]);

  if (!isVerified) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
