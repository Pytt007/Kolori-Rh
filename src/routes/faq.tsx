import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ChevronDown, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Foire Aux Questions — Kolori RH" },
      { name: "description", content: "Trouvez les réponses à toutes vos questions concernant l'utilisation de la plateforme de recrutement et solutions RH Kolori RH." },
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
      question: "Comment postuler à une offre sur Kolori RH ?",
      answer: "Pour postuler, vous devez d'abord créer un compte candidat. Ensuite, complétez votre profil avec vos compétences, vos diplômes et déposez votre CV au format PDF, DOC ou DOCX (max 5 Mo). Vous pourrez alors cliquer sur le bouton 'Postuler' présent sur chaque offre d'emploi.",
    },
    {
      question: "Comment suivre l'avancement de mes candidatures ?",
      answer: "Kolori RH propose un suivi transparent en temps réel. Rendez-vous dans votre Espace Candidat, onglet 'Mes candidatures'. Vous pourrez voir le statut précis de votre dossier (ex: Envoyée, En analyse, Présélectionné, Entretien, Retenu, Rejeté) mis à jour directement par le recruteur.",
    },
    {
      question: "Qui peut voir mon CV et mes informations personnelles ?",
      answer: "Vos informations sont protégées par des politiques de sécurité strictes. Votre profil et vos CV sont visibles par vous-même, par les administrateurs de la plateforme, ainsi que par les recruteurs inscrits et validés sur la plateforme. Personne d'autre ne peut y accéder.",
    },
    {
      question: "Puis-je retirer une candidature après l'avoir envoyée ?",
      answer: "Oui, vous pouvez retirer votre candidature à tout moment depuis votre tableau de bord. Cela supprimera instantanément l'accès du recruteur à vos documents et à votre lettre pour ce poste spécifique.",
    },
  ];

  const faqRecruiter: FaqItem[] = [
    {
      question: "Comment puis-je publier ma première offre d'emploi ?",
      answer: "Créez d'abord un compte Recruteur, puis complétez les informations relatives à votre entreprise dans la rubrique 'Mon entreprise'. Une fois ces informations saisies, votre entreprise passera au statut 'En attente'. Dès qu'un administrateur de Kolori RH valide votre fiche entreprise, vous recevez le droit de publier vos offres d'emploi publiques.",
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
      answer: "Pour garantir la qualité des recruteurs et protéger les candidats, toutes les fiches d'entreprises créées sont soumises à une vérification manuelle par les administrateurs de Kolori RH avant la mise en ligne des annonces. Ce processus prend généralement moins de 24 heures.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-primary text-primary-foreground py-16 px-6 relative overflow-hidden mb-12">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mb-32 pointer-events-none" />
          <div className="max-w-4xl mx-auto z-10 relative text-center">
            <HelpCircle className="h-12 w-12 text-accent mx-auto mb-4 animate-bounce" />
            <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-4">
              Foire Aux Questions
            </h1>
            <p className="text-base md:text-lg opacity-90 max-w-2xl mx-auto font-light leading-relaxed">
              Retrouvez toutes les réponses pour utiliser au mieux la plateforme de recrutement et solutions RH Kolori RH.
            </p>
          </div>
        </section>

        {/* Accordions */}
        <div className="max-w-4xl mx-auto px-6 pb-24 w-full">
          {/* Candidats Accordion */}
          <section className="mb-12 animate-reveal">
            <h2 className="font-display font-bold text-2xl mb-6 text-primary border-b border-border pb-2">
              Espace Candidats
            </h2>
            <div className="space-y-4">
              {faqCandidate.map((item, idx) => {
                const globalIdx = idx;
                const isOpen = openIndex === globalIdx;
                return (
                  <div key={idx} className="border border-border bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200">
                    <button
                      onClick={() => toggle(globalIdx)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left font-display font-bold text-base hover:text-primary transition-colors"
                    >
                      <span>{item.question}</span>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-80 border-t border-border/50 bg-muted/30" : "max-h-0"}`}>
                      <p className="p-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recruteurs Accordion */}
          <section className="mb-16 animate-reveal [animation-delay:100ms]">
            <h2 className="font-display font-bold text-2xl mb-6 text-primary border-b border-border pb-2">
              Espace Recruteurs
            </h2>
            <div className="space-y-4">
              {faqRecruiter.map((item, idx) => {
                const globalIdx = faqCandidate.length + idx;
                const isOpen = openIndex === globalIdx;
                return (
                  <div key={idx} className="border border-border bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200">
                    <button
                      onClick={() => toggle(globalIdx)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left font-display font-bold text-base hover:text-primary transition-colors"
                    >
                      <span>{item.question}</span>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-80 border-t border-border/50 bg-muted/30" : "max-h-0"}`}>
                      <p className="p-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
