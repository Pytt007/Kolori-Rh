import { createFileRoute, Outlet, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const mockUser = localStorage.getItem("mock_auth_user");
    const mockRoles = localStorage.getItem("mock_auth_roles");
    if (mockUser && mockRoles) return;

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/connexion", search: { redirect: location.href } as never });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/connexion", replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm font-mono">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}

// Helper re-exports for child routes if needed
export { Link };
