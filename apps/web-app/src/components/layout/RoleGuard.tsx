"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@kavach/shared-types";
import { getStoredUser } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
    } else if (!allowedRoles.includes(user.role)) {
      router.push("/");
    } else {
      setChecking(false);
    }
  }, [allowedRoles, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
