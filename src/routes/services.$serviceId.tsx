import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { 
  Users, 
  Briefcase, 
  Settings, 
  Scale, 
  ChevronRight,
  ArrowRight
} from "lucide-react";

type ServiceDetail = {
  title: string;
  category: string;
  subtitle: string;
  description: string;
  sections: { title: string; content: string }[];
};

const SERVICES_DATA: Record<string, ServiceDetail> = {
  "chasse-de-tetes": {
    title: "Chasse de Têtes (Executive Search)",
    category: "Recrutement de Cadres",
    subtitle: "Identifier et attirer les dirigeants clés pour mener votre entreprise vers le succès.",
    description: "La recherche de cadres et dirigeants exige une approche hautement qualitative et discrète. Nous ciblons les meilleurs leaders de votre secteur.",
    sections: [
      { title: "Approche sur-mesure", content: "Chaque mission de chasse de têtes débute par une analyse rigoureuse de la culture de votre entreprise et des compétences stratégiques requises." },
      { title: "Confidentialité totale", content: "Nous agissons avec discrétion tout au long du processus afin de protéger les intérêts de votre marque et la réputation des candidats contactés." },
      { title: "Évaluation multicritère", content: "Au-delà des compétences techniques, nous analysons l'intelligence relationnelle et l'adéquation comportementale des candidats." }
    ]
  },
  "profils-candidats": {
    title: "Profils Candidats",
    category: "Recrutement de Cadres",
    subtitle: "Valoriser et cartographier les meilleures compétences pour vos besoins futurs.",
    description: "Nous constituons des bassins de talents qualifiés et prêts à s'investir dans vos projets.",
    sections: [
      { title: "Veille de talents", content: "Nos consultants cartographient continuellement les profils à fort potentiel dans différents secteurs d'activité." },
      { title: "Vérification des antécédents", content: "Chaque profil présenté fait l'objet d'une validation rigoureuse des références professionnelles et des diplômes." }
    ]
  },
  "tests-psychometriques": {
    title: "Tests Psychométriques",
    category: "Recrutement de Cadres",
    subtitle: "Valider scientifiquement le potentiel et les soft skills de vos futurs collaborateurs.",
    description: "Les tests psychométriques apportent de la rigueur et de l'objectivité en analysant le comportement et la cognition des candidats.",
    sections: [
      { title: "Qu'est-ce qu'un test psychométrique ?", content: "C'est un outil d'évaluation normalisé mesurant les aptitudes intellectuelles, les traits de personnalité et les motivations d'un candidat." },
      { title: "Que mesurent nos évaluations ?", content: "Nos tests mesurent la résistance au stress, la capacité de travail en équipe, la résolution de problèmes complexes et le profil de leadership." },
      { title: "Avantages de l'évaluation", content: "Il permet de limiter les erreurs de recrutement, d'anticiper la performance en poste et de faciliter l'intégration au sein des équipes." }
    ]
  },
  "services-de-placement": {
    title: "Services de Placement",
    category: "Recrutement de Cadres",
    subtitle: "Un accompagnement de A à Z pour réussir l'intégration de vos recrues.",
    description: "Notre accompagnement ne s'arrête pas à la signature du contrat. Nous suivons l'intégration du nouveau collaborateur durant toute sa période d'essai.",
    sections: [
      { title: "Onboarding personnalisé", content: "Suivi mensuel avec le candidat et le manager pour s'assurer d'une bonne prise de poste." },
      { title: "Garantie de remplacement", content: "En cas de départ prématuré, nous nous engageons à relancer la recherche gratuitement." }
    ]
  },
  "systemes-rh": {
    title: "Systèmes RH & SIRH",
    category: "Solutions RH",
    subtitle: "Digitaliser et structurer la gestion de vos ressources humaines.",
    description: "Un SIRH moderne est le moteur d'une gestion RH fluide. Nous vous accompagnons de la conception au déploiement de vos outils digitaux.",
    sections: [
      { title: "Simplification administrative", content: "Centralisez les dossiers du personnel, les demandes de congés et les plannings sur une plateforme unique." },
      { title: "Performance et rapports", content: "Pilotez des tableaux de bord en temps réel pour analyser le climat social, la rotation du personnel et les performances." }
    ]
  },
  "conseil-rh": {
    title: "Conseil RH",
    category: "Solutions RH",
    subtitle: "Optimiser vos organisations et développer votre capital humain.",
    description: "Nos experts vous conseillent pour adapter vos structures RH aux évolutions de votre marché.",
    sections: [
      { title: "Audit organisationnel", content: "Analyse des processus existants pour identifier les gains de productivité et améliorer la communication interne." },
      { title: "Accompagnement du changement", content: "Soutien managérial lors de fusions-acquisitions, de réorganisations ou de croissances d'effectifs." }
    ]
  },
  "enquetes-salariales": {
    title: "Enquêtes Salariales & Avantages",
    category: "Solutions RH",
    subtitle: "Ajuster vos politiques de rémunération pour attirer les meilleurs talents.",
    description: "Pour rester compétitif, vous devez aligner votre politique salariale sur le marché actuel.",
    sections: [
      { title: "Étude comparative du marché", content: "Rapports précis comparant vos grilles de salaires aux moyennes sectorielles régionales." },
      { title: "Avantages en nature", content: "Conseils pour mettre en place des avantages innovants (flexibilité, mutuelle, titres cadeaux)." }
    ]
  },
  "externalisation": {
    title: "Externalisation des RH",
    category: "Services RH",
    subtitle: "Déléguer votre fonction RH pour vous concentrer sur votre cœur de métier.",
    description: "Confiez-nous tout ou partie de votre gestion des ressources humaines de manière flexible et sécurisée.",
    sections: [
      { title: "Gestion quotidienne", content: "Suivi des visites médicales, élaboration des fiches de postes et entretiens professionnels." },
      { title: "Consultant dédié", content: "Un interlocuteur unique se déplace ou répond à toutes les problématiques RH de vos collaborateurs." }
    ]
  },
  "gestion-de-la-paie": {
    title: "Gestion de la Paie",
    category: "Services RH",
    subtitle: "Garantir une paie exacte, conforme et livrée en temps voulu.",
    description: "La paie est un sujet complexe et réglementé. Nous assurons son traitement sans erreur.",
    sections: [
      { title: "Établissement des bulletins", content: "Calcul des cotisations sociales, gestion des heures supplémentaires et primes." },
      { title: "Déclarations sociales", content: "Transmission sécurisée des déclarations obligatoires (DSN, mutuelles, prévoyances)." }
    ]
  },
  "droit-du-travail": {
    title: "Conseil en Droit du Travail",
    category: "Services RH",
    subtitle: "Sécuriser vos relations sociales et veiller à la conformité juridique.",
    description: "Nous vous apportons une assistance juridique permanente pour prévenir les risques de contentieux avec vos salariés.",
    sections: [
      { title: "Rédaction de contrats", content: "Production et mise à jour de vos contrats de travail, clauses spécifiques et règlements intérieurs." },
      { title: "Rupture de contrat", content: "Accompagnement sécurisé lors de procédures de l'inspection du travail ou de licenciement." }
    ]
  },
  "relations-gouvernementales": {
    title: "Relations Gouvernementales",
    category: "Services RH",
    subtitle: "Faciliter vos démarches auprès des administrations de l'emploi.",
    description: "Nous gérons pour vous l'ensemble des formalités avec les organismes officiels.",
    sections: [
      { title: "Suivi de conformité", content: "Représentation et médiation lors de contrôles de l'inspection du travail ou des organismes sociaux." },
      { title: "Dossiers d'aides à l'embauche", content: "Constitution et suivi des demandes de subventions et exonérations pour embauche." }
    ]
  },
  "marque-employeur": {
    title: "Marque Employeur",
    category: "Services RH",
    subtitle: "Valoriser votre culture d'entreprise pour attirer les candidats idéaux.",
    description: "Votre réputation en tant qu'employeur est votre meilleur atout recrutement.",
    sections: [
      { title: "Proposition de valeur (EVP)", content: "Définition claire de ce qui rend votre entreprise unique et attractive." },
      { title: "Stratégie de communication", content: "Création de contenus pour vos réseaux sociaux et pages carrières afin d'inspirer les talents." }
    ]
  }
};

export const Route = createFileRoute("/services/$serviceId")({
  head: ({ params }) => {
    const service = SERVICES_DATA[params.serviceId];
    return {
      meta: [
        { title: service ? `${service.title} — Kolori RH` : "Service — Kolori RH" },
        { name: "description", content: service ? service.subtitle : "Découvrez nos services RH." },
      ],
    };
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { serviceId } = Route.useParams();
  const service = SERVICES_DATA[serviceId];

  if (!service) {
    throw notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Service Hero section */}
        <section className="bg-primary text-primary-foreground py-20 px-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mb-32 pointer-events-none" />
          <div className="max-w-7xl mx-auto z-10 relative">
            <span className="text-xs uppercase tracking-widest text-accent-foreground/80 font-bold bg-white/10 px-3 py-1 rounded-full">
              {service.category}
            </span>
            <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight mt-6 mb-4">
              {service.title}
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl font-light leading-relaxed">
              {service.subtitle}
            </p>
          </div>
        </section>

        {/* Content Layout: Sidebar menu + Main details */}
        <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-12 gap-12">
          
          {/* Left Menu Sidebar */}
          <aside className="lg:col-span-4 bg-muted/30 border border-border rounded-3xl p-6 h-fit space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-4">Nos Solutions</span>
              <nav className="flex flex-col gap-1">
                {Object.entries(SERVICES_DATA).map(([key, val]) => {
                  const isActive = key === serviceId;
                  return (
                    <Link
                      key={key}
                      to="/services/$serviceId"
                      params={{ serviceId: key }}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow" 
                          : "hover:bg-secondary text-foreground/80 hover:text-foreground"
                      }`}
                    >
                      <span>{val.title.split(" (")[0]}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right Main Content */}
          <article className="lg:col-span-8 space-y-10">
            <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
              <h2 className="font-display font-bold text-2xl mb-4 text-foreground">Présentation du Service</h2>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{service.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {service.sections.map((sec, index) => (
                <div key={index} className="bg-white border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <h3 className="font-display font-bold text-lg mb-2 text-foreground">{sec.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>

            {/* Custom Contact Box inside Service Page */}
            <div className="bg-accent text-accent-foreground rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
              <div className="space-y-2 z-10 text-center md:text-left">
                <span className="text-[10px] uppercase tracking-widest text-accent-foreground/80 font-bold">BESOIN DE CONSEIL ?</span>
                <h4 className="text-xl font-display font-bold">Parlons de vos enjeux RH</h4>
                <p className="text-xs opacity-90">Nos consultants vous proposent une solution sur-mesure sous 48 heures.</p>
              </div>
              <Link 
                to="/contact"
                className="z-10 bg-white text-accent font-bold px-6 py-3 rounded-full hover:bg-neutral-100 transition-colors text-xs shadow shrink-0"
              >
                Nous Contacter <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </Link>
            </div>
          </article>

        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
