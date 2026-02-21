"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@kavach/shared-types";
import { useAuth } from "@/context/AuthContext";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!allowedRoles.includes(user.role as Role)) {
      router.push("/");
    }
  }, [user, loading, allowedRoles, router]);

  return <>{children}</>;
}
