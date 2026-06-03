import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "candidat" | "recruteur" | "admin";

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
}

const defaultAuth: AuthState = {
  isAuthenticated: false,
  user: null,
  session: null,
  roles: [],
  loading: true,
  hasRole: () => false,
  signOut: async () => {},
};

const AuthContext = createContext<AuthState>(defaultAuth);

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as AppRole);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check mock authentication in localStorage first
    const mockUserStr =
      typeof window !== "undefined" ? localStorage.getItem("mock_auth_user") : null;
    const mockRolesStr =
      typeof window !== "undefined" ? localStorage.getItem("mock_auth_roles") : null;
    if (mockUserStr && mockRolesStr) {
      const mockUser = JSON.parse(mockUserStr);
      setUser(mockUser);
      setRoles(JSON.parse(mockRolesStr));
      setSession({
        access_token: "mock-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh",
        user: mockUser,
      } as any);
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // If we are in mock mode, ignore
      if (typeof window !== "undefined" && localStorage.getItem("mock_auth_user")) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // defer to avoid recursion warning
        setTimeout(() => {
          fetchRoles(newSession.user.id).then(setRoles);
        }, 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (typeof window !== "undefined" && localStorage.getItem("mock_auth_user")) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchRoles(data.session.user.id)
          .then(setRoles)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    isAuthenticated: !!user,
    user,
    session,
    roles,
    loading,
    hasRole: (role) => roles.includes(role),
    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mock_auth_user");
        localStorage.removeItem("mock_auth_roles");
      }
      await supabase.auth.signOut();
      setUser(null);
      setRoles([]);
      setSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
