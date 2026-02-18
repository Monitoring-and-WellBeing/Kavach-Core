import { Role } from "@kavach/shared-types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  avatar?: string;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const data = sessionStorage.getItem("kavach_user");
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    // Map demo role strings to Role enum
    const roleMap: Record<string, Role> = {
      parent: Role.PARENT,
      student: Role.STUDENT,
      institute: Role.INSTITUTE_ADMIN,
    };
    return {
      id: "demo-user",
      name:
        parsed.role === "parent"
          ? "Rajesh Kumar"
          : parsed.role === "student"
          ? "Rahul Sharma"
          : "School Admin",
      email: parsed.email,
      role: roleMap[parsed.role] || Role.PARENT,
      tenantId: "tenant-001",
    };
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("kavach_user");
  localStorage.removeItem("kavach_token");
  window.location.href = "/";
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}
