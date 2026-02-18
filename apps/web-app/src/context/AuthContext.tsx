"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Role = "student" | "parent" | "institute";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  subtitle: string;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  setRole: (r: Role) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const mockUsers: Record<string, User> = {
  "student@demo.com": {
    id: "u-001",
    name: "Rahul Sharma",
    email: "student@demo.com",
    role: "student",
    avatar: "RS",
    subtitle: "Student Portal",
    tenantId: "t-001",
  },
  "parent@demo.com": {
    id: "u-002",
    name: "Meena Singh",
    email: "parent@demo.com",
    role: "parent",
    avatar: "MS",
    subtitle: "Parent Dashboard",
    tenantId: "t-001",
  },
  "admin@demo.com": {
    id: "u-003",
    name: "Aarav Singh",
    email: "admin@demo.com",
    role: "institute",
    avatar: "AS",
    subtitle: "Institute Admin",
    tenantId: "t-001",
  },
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("student");

  const login = (email: string, password: string): boolean => {
    const found = mockUsers[email];
    if (found && password === "demo123") {
      setUser(found);
      setRole(found.role);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, role, setRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

