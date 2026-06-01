import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/site/DashboardShell";
import { RoleGate } from "@/components/site/RoleGate";

export const Route = createFileRoute("/_authenticated/candidat")({
  head: () => ({ meta: [{ title: "Espace candidat — L'Alternative" }] }),
  component: CandidatLayout,
});

function CandidatLayout() {
  return (
    <RoleGate allow={["candidat"]}>
      <DashboardShell
        title="Espace candidat"
        nav={[
          { to: "/candidat", label: "Tableau de bord" },
          { to: "/candidat/profil", label: "Mon profil" },
          { to: "/candidat/cv", label: "Mes CV" },
          { to: "/candidat/candidatures", label: "Mes candidatures" },
          { to: "/candidat/messages", label: "Messages" },
          { to: "/offres", label: "Parcourir les offres" },
        ]}
      >
        <Outlet />
      </DashboardShell>
    </RoleGate>
  );
}
