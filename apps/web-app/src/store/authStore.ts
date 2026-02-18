import { create } from "zustand";
import { Role } from "@kavach/shared-types";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  avatar?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setUser: (user: AuthUser) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kavach_token", token);
    }
    set({ token });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kavach_token");
      sessionStorage.removeItem("kavach_user");
    }
    set({ user: null, token: null });
  },
}));
