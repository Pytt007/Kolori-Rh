import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ChevronDown, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Foire Aux Questions — L'Alternative" },
      { name: "description", content: "Trouvez les réponses à toutes vos questions concernant l'utilisation de la plateforme de recrutement RH L'Alternative." },
    ],
  }),
  component: FaqPage,
});

type FaqItem = {
  question: string;
  answer: string;
};

function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const faqCandidate: FaqItem[] = [
    {
      question: "Comment postuler à une offre sur L'Alternative ?",
      answer: "Pour postuler, vous devez d'abord créer un compte candidat. Ensuite, complétez votre profil avec vos compétences, vos diplômes et déposez votre CV au format PDF, DOC ou DOCX (max 5 Mo). Vous pourrez alors cliquer sur le bouton 'Postuler' présent sur chaque offre d'emploi.",
    },
    {
      question: "Comment suivre l'avancement de mes candidatures ?",
      answer: "L'Alternative propose un suivi transparent en temps réel. Rendez-vous dans votre Espace Candidat, onglet 'Mes candidatures'. Vous pourrez voir le statut précis de votre dossier (ex: Envoyée, En analyse, Présélectionné, Entretien, Retenu, Rejeté) mis à jour directement par le recruteur.",
    },
    {
      question: "Qui peut voir mon CV et mes informations personnelles ?",
      answer: "Vos informations sont protégées par des politiques de sécurité strictes (RLS). Votre profil et vos CV sont visibles par vous-même, par les administrateurs de la plateforme, ainsi que par les recruteurs inscrits et validés sur la plateforme. Personne d'autre ne peut y accéder.",
    },
    {
      question: "Puis-je retirer une candidature après l'avoir envoyée ?",
      answer: "Oui, vous pouvez retirer votre candidature à tout moment depuis votre tableau de bord. Cela supprimera instantanément l'accès du recruteur à vos documents et à votre lettre pour ce poste spécifique.",
    },
  ];

  const faqRecruiter: FaqItem[] = [
    {
      question: "Comment puis-je publier ma première offre d'emploi ?",
      answer: "Créez d'abord un compte Recruteur, puis complétez les informations relatives à votre entreprise dans la rubrique 'Mon entreprise'. Une fois ces informations saisies, votre entreprise passera au statut 'En attente'. Dès qu'un administrateur valide votre fiche entreprise, vous recevez le droit de publier vos offres d'emploi publiques.",
    },
    {
      question: "Comment fonctionne la recherche de candidats dans la CVthèque ?",
      answer: "La CVthèque vous permet de rechercher des profils par mots-clés (intitulé de poste, nom, prénom, compétences spécifiques) ou par localisation géographique. Vous avez accès au profil détaillé des candidats inscrits, y compris leurs compétences et prétentions salariales.",
    },
    {
      question: "Puis-je enregistrer des candidats dans mes favoris ?",
      answer: "Oui, vous pouvez marquer des candidats intéressants en tant que 'Favori' depuis la CVthèque. Vous pourrez ensuite retrouver tous vos profils favoris sur votre espace dédié pour faciliter votre sélection finale.",
    },
    {
      question: "Qu'est-ce que le système de modération des entreprises ?",
      answer: "Pour garantir la qualité des recruteurs et protéger les candidats, toutes les fiches d'entreprises créées sont soumises à une vérification manuelle par les administrateurs avant la mise en ligne des annonces. Ce processus prend généralement moins de 24 heures.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        {/* Title */}
        <section className="text-center mb-16 animate-reveal">
          <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-display italic text-5xl mb-3">Foire Aux Questions.</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Retrouvez toutes les réponses pour utiliser au mieux la plateforme L'Alternative.
          </p>
        </section>

        {/* Candidats Accordion */}
        <section className="mb-12 animate-reveal [animation-delay:100ms]">
          <h2 className="font-display italic text-3xl mb-6 text-primary border-b border-border pb-2">Espace Candidats</h2>
          <div className="space-y-4">
            {faqCandidate.map((item, idx) => {
              const globalIdx = idx;
              const isOpen = openIndex === globalIdx;
              return (
                <div key={idx} className="border border-border bg-card rounded-sm transition-all duration-200">
                  <button
                    onClick={() => toggle(globalIdx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-display italic text-lg hover:text-primary transition-colors"
                  >
                    <span>{item.question}</span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-80 border-t border-border/50" : "max-h-0"}`}>
                    <p className="p-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-secondary/10">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recruteurs Accordion */}
        <section className="mb-16 animate-reveal [animation-delay:200ms]">
          <h2 className="font-display italic text-3xl mb-6 text-primary border-b border-border pb-2">Espace Recruteurs</h2>
          <div className="space-y-4">
            {faqRecruiter.map((item, idx) => {
              const globalIdx = faqCandidate.length + idx;
              const isOpen = openIndex === globalIdx;
              return (
                <div key={idx} className="border border-border bg-card rounded-sm transition-all duration-200">
                  <button
                    onClick={() => toggle(globalIdx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-display italic text-lg hover:text-primary transition-colors"
                  >
                    <span>{item.question}</span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-80 border-t border-border/50" : "max-h-0"}`}>
                    <p className="p-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-secondary/10">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
