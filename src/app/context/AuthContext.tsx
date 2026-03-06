import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import api from "../lib/api-client";
import type { MeResponse, Membership, LoginResponse } from "../types/api";

export type UserRole = "admin" | "instructor" | "trainee";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team: string;
  initials: string;
  memberships: Membership[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ role: UserRole }>;
  logout: () => void;
  isAdmin: boolean;
  isLearner: boolean;
}

function deriveRole(memberships: Membership[]): UserRole {
  if (memberships.some((m) => m.role === "ADMIN")) return "admin";
  if (memberships.some((m) => m.role === "INSTRUCTOR")) return "instructor";
  return "trainee";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function toAuthUser(me: MeResponse): AuthUser {
  const role = deriveRole(me.memberships);
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    role,
    team: "",
    initials: getInitials(me.name),
    memberships: me.memberships,
  };
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({ role: "trainee" as UserRole }),
  logout: () => {},
  isAdmin: false,
  isLearner: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<MeResponse>("/auth/me");
      setUser(toAuthUser(data));
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    const meRes = await api.get<MeResponse>("/auth/me");
    const authUser = toAuthUser(meRes.data);
    setUser(authUser);
    return { role: authUser.role };
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const isAdmin = user?.role === "admin" || user?.role === "instructor";
  const isLearner = user?.role === "trainee";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isLearner }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
