import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — L'Alternative" },
      {
        name: "description",
        content: "Politique de confidentialité et traitement des données personnelles.",
      },
    ],
  }),
  component: ConfPage,
});

function ConfPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Données personnelles
        </div>
        <h1 className="font-display italic text-5xl mb-10">Confidentialité.</h1>
        <div className="prose prose-stone max-w-none space-y-6 text-sm">
          <section>
            <h2 className="font-display italic text-2xl mb-2">Données collectées</h2>
            <p>
              Lors de votre inscription, nous collectons : nom, prénom, adresse email, et selon
              votre profil, votre CV, vos expériences et compétences (candidats), ou les
              informations de votre entreprise (recruteurs).
            </p>
          </section>
          <section>
            <h2 className="font-display italic text-2xl mb-2">Finalité</h2>
            <p>
              Ces données sont utilisées pour la mise en relation entre candidats et recruteurs, et
              pour le bon fonctionnement de la plateforme.
            </p>
          </section>
          <section>
            <h2 className="font-display italic text-2xl mb-2">Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'opposition
              et de suppression de vos données. Adressez votre demande à
              privacy@lalternative-rh.example.
            </p>
          </section>
          <section>
            <h2 className="font-display italic text-2xl mb-2">Conservation</h2>
            <p>
              Vos données sont conservées tant que votre compte est actif. Vous pouvez demander leur
              suppression à tout moment.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
