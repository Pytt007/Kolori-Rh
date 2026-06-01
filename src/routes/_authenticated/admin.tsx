import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/site/DashboardShell";
import { RoleGate } from "@/components/site/RoleGate";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administration — L'Alternative" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <RoleGate allow={["admin"]}>
      <DashboardShell
        title="Administration"
        nav={[
          { to: "/admin", label: "Tableau de bord" },
          { to: "/admin/utilisateurs", label: "Utilisateurs" },
          { to: "/admin/entreprises", label: "Entreprises" },
          { to: "/admin/offres", label: "Offres" },
          { to: "/admin/referentiels", label: "Référentiels" },
        ]}
      >
        <Outlet />
      </DashboardShell>
    </RoleGate>
  );
}
