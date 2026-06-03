import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/site/AuthShell";
import { User, Briefcase, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/inscription/")({
  head: () => ({
    meta: [
      { title: "Créer un compte — Kolori RH" },
      {
        name: "description",
        content: "Sélectionnez votre type de profil pour créer votre compte sur Kolori RH.",
      },
    ],
  }),
  component: InscriptionIndexPage,
});

function InscriptionIndexPage() {
  return (
    <AuthShell
      eyebrow="Inscription"
      title="Créer un compte."
      subtitle="Veuillez sélectionner le type de compte que vous souhaitez créer."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link to="/connexion" className="text-primary font-semibold hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <div className="space-y-4 mt-2">
        {/* Card Candidat */}
        <Link
          to="/inscription/candidat"
          className="group block p-4 rounded-xl border border-border bg-[#1d3a6c]/[0.02] hover:bg-[#1d3a6c]/[0.05] hover:border-primary transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#1d3a6c]/10 text-primary group-hover:bg-[#1d3a6c] group-hover:text-white transition-colors duration-300">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                Je cherche un emploi
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Créez votre profil candidat, déposez votre CV et postulez aux offres.
              </p>
            </div>
          </div>
        </Link>

        {/* Card Recruteur */}
        <Link
          to="/inscription/recruteur"
          className="group block p-4 rounded-xl border border-border bg-[#059669]/[0.02] hover:bg-[#059669]/[0.05] hover:border-[#059669] transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#059669]/10 text-[#059669] group-hover:bg-[#059669] group-hover:text-white transition-colors duration-300">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 group-hover:text-[#059669] transition-colors">
                Je recrute
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Créez la fiche de votre entreprise et publiez vos offres de recrutement.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </AuthShell>
  );
}
