// auth.ts — lightweight helpers that read from the real session tokens set by AuthContext.tsx
// The canonical auth state lives in AuthContext (useAuth hook).
// These helpers are used by legacy components (Sidebar, TopBar, RoleGuard) for quick checks.

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  avatar?: string;
}

/**
 * Returns the authenticated user from localStorage (set by AuthContext on login).
 * Returns null if not authenticated.
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  // Check if a valid access token exists — if not, user is not authenticated
  const token = localStorage.getItem("kavach_access_token");
  if (!token) return null;
  // Try to read the cached user profile stored by AuthContext
  const data = localStorage.getItem("kavach_user_profile");
  if (!data) {
    // Token exists but profile not cached yet — return a minimal placeholder
    // so guards don't redirect during the /auth/me fetch
    return { id: "", name: "", email: "", role: "", tenantId: "" };
  }
  try {
    return JSON.parse(data) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Clears all session tokens and redirects to home.
 * Clears both old (kavach_token) and current (kavach_access_token/kavach_refresh_token) keys.
 */
export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("kavach_access_token");
  localStorage.removeItem("kavach_refresh_token");
  localStorage.removeItem("kavach_token"); // legacy key — clear for safety
  localStorage.removeItem("kavach_user_profile");
  sessionStorage.removeItem("kavach_user");
  window.location.href = "/";
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("kavach_access_token");
}
