"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@kavach/shared-types";
import { getStoredUser } from "./auth";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.push("/");
    }
  }, [allowedRoles, router]);

  return <>{children}</>;
}
