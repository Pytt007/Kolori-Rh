import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/site/AuthShell";
import { User, Briefcase, ShieldAlert, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/connexion/")({
  head: () => ({
    meta: [
      { title: "Connexion — Kolori RH" },
      {
        name: "description",
        content: "Sélectionnez votre profil pour accéder à votre espace de connexion Kolori RH.",
      },
    ],
  }),
  component: ConnexionIndexPage,
});

function ConnexionIndexPage() {
  return (
    <AuthShell
      eyebrow="Portail d'accès"
      title="Bienvenue."
      subtitle="Veuillez sélectionner votre type de profil pour vous connecter."
      footer={
        <>
          Pas encore inscrit ?{" "}
          <Link to="/inscription" className="text-primary font-semibold hover:underline">
            Créer un compte candidat
          </Link>
        </>
      }
    >
      <div className="space-y-4 mt-2">
        {/* Card Candidat */}
        <Link
          to="/connexion/candidat"
          className="group block p-4 rounded-xl border border-border bg-[#1d3a6c]/[0.02] hover:bg-[#1d3a6c]/[0.05] hover:border-primary transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#1d3a6c]/10 text-primary group-hover:bg-[#1d3a6c] group-hover:text-white transition-colors duration-300">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                Espace Candidat
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Trouvez un emploi, suivez vos candidatures et gérez votre profil.
              </p>
            </div>
          </div>
        </Link>

        {/* Card Recruteur */}
        <Link
          to="/connexion/recruteur"
          className="group block p-4 rounded-xl border border-border bg-[#059669]/[0.02] hover:bg-[#059669]/[0.05] hover:border-[#059669] transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#059669]/10 text-[#059669] group-hover:bg-[#059669] group-hover:text-white transition-colors duration-300">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 group-hover:text-[#059669] transition-colors">
                Espace Recruteur
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Publiez des offres, gérez vos recrutements et trouvez des talents.
              </p>
            </div>
          </div>
        </Link>

        {/* Card Administrateur */}
        <Link
          to="/connexion/admin"
          className="group block p-4 rounded-xl border border-border bg-[#7c3aed]/[0.02] hover:bg-[#7c3aed]/[0.05] hover:border-[#7c3aed] transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors duration-300">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 group-hover:text-[#7c3aed] transition-colors">
                Espace Administrateur
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gérez la plateforme, modérez les offres et administrez les utilisateurs.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </AuthShell>
  );
}
