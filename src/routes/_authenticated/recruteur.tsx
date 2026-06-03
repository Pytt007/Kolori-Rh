import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/site/DashboardShell";
import { RoleGate } from "@/components/site/RoleGate";

export const Route = createFileRoute("/_authenticated/recruteur")({
  head: () => ({ meta: [{ title: "Espace recruteur — L'Alternative" }] }),
  component: RecruteurLayout,
});

function RecruteurLayout() {
  return (
    <RoleGate allow={["recruteur"]}>
      <DashboardShell
        title="Espace recruteur"
        nav={[
          { to: "/recruteur", label: "Tableau de bord" },
          { to: "/recruteur/entreprise", label: "Mon entreprise" },
          { to: "/recruteur/offres", label: "Mes offres" },
          { to: "/recruteur/candidatures", label: "Candidatures reçues" },
          { to: "/recruteur/cvtheque", label: "CVthèque" },
          { to: "/recruteur/favoris", label: "Favoris" },
          { to: "/offres", label: "Voir les offres publiques" },
        ]}
      >
        <Outlet />
      </DashboardShell>
    </RoleGate>
  );
}
