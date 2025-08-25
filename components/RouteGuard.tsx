"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type React from "react";

type RouteGuardProps = {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "manager" | "user" | "warehouse")[];
};

interface User {
  role: "admin" | "manager" | "user" | "warehouse";
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user } = useAuth() as { user: User | null };
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user === undefined) return; // Tunggu sampai user benar-benar terisi

    if (!user) {
      router.replace("/login");
    } else if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/unauthorized");
    } else {
      setIsVerified(true); // Hanya izinkan render jika user valid
    }
  }, [user, router, allowedRoles]);

  if (!isVerified) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
