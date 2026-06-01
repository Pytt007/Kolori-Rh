import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth-context";

export function RoleGate({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { loading, roles, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const allowed = roles.some((r) => allow.includes(r));
    if (!allowed) {
      const target = roles.includes("admin") ? "/admin" : roles.includes("recruteur") ? "/recruteur" : "/candidat";
      navigate({ to: target, replace: true });
    }
  }, [loading, isAuthenticated, roles, allow, navigate]);

  if (loading) {
    return <div className="p-12 text-sm text-muted-foreground font-mono">Chargement…</div>;
  }
  if (!roles.some((r) => allow.includes(r))) return null;
  return <>{children}</>;
}
