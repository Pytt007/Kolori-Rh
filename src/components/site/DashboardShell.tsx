import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: { to: string; label: string }[];
  children: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      <aside className="border-r border-border bg-sidebar p-6 flex flex-col">
        <Link to="/" className="flex items-center gap-2 mb-10 group">
          <img src="/logo.png" alt="Kolori RH" className="h-12 object-contain transition-transform group-hover:scale-105" />
        </Link>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">{title}</div>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map((n) => {
            const active = location.pathname === n.to || location.pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-2 text-sm rounded-sm transition-colors ${
                  active ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-secondary"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border pt-4 mt-4">
          <div className="text-xs text-muted-foreground truncate mb-2">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </aside>
      <main className="p-8 md:p-12">{children}</main>
    </div>
  );
}
