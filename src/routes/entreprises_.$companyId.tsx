import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MOCK_COMPANIES,
  MOCK_JOB_OFFERS,
  getMockCompanies,
  getMockJobOffers,
} from "@/lib/mockData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Globe,
  Briefcase,
  Building2,
  Calendar,
  ArrowLeft,
  Users,
  Coins,
  Heart,
  CheckCircle2,
  Star,
} from "lucide-react";

type CompanyType = {
  id: string;
  nom: string;
  logo_url: string | null;
  secteur: string | null;
  localisation: string | null;
  description: string | null;
  site_web: string | null;
};

type OfferType = {
  id: string;
  titre: string;
  description: string;
  contrat: string;
  localisation: string | null;
  teletravail: string | null;
  publiee_le: string | null;
};

type RichMetadata = {
  taille: string;
  fondation: string;
  ca: string;
  valeurs: string[];
  pourquoiRejoindre: string;
  perks: string[];
};

const RICH_COMPANY_DATA: Record<string, RichMetadata> = {
  "company-1": {
    taille: "100 - 250 collaborateurs",
    fondation: "2015",
    ca: "2,1 milliards FCFA",
    valeurs: ["Innovation", "Agilité", "Excellence technique"],
    pourquoiRejoindre:
      "Chez Ivory Tech Solutions, nous croyons à l'excellence et au développement des compétences locales. Vous travaillerez sur des projets de transformation digitale d'envergure nationale en Côte d'Ivoire tout en profitant d'horaires flexibles, de formations certifiantes et d'une couverture médicale de premier choix.",
    perks: [
      "Horaires de travail flexibles",
      "Formations & Certifications financées",
      "Couverture santé 100% premium",
      "Locaux modernes & Café à volonté",
    ],
  },
  "company-2": {
    taille: "1000+ collaborateurs",
    fondation: "1962",
    ca: "95 milliards FCFA",
    valeurs: ["Rigueur", "Confiance", "Service d'excellence"],
    pourquoiRejoindre:
      "Rejoindre la SIB, c'est intégrer un pilier historique du paysage financier ivoirien. Nous offrons des parcours de carrière d'une richesse exceptionnelle, une culture axée sur la rigueur professionnelle, ainsi que des avantages sociaux de premier ordre.",
    perks: [
      "Grille salariale attractive & 13ème mois",
      "Prêts immobiliers négociés pour les salariés",
      "Activités sportives & Comité d'entreprise",
      "Régime retraite d'entreprise complémentaire",
    ],
  },
  "company-3": {
    taille: "250 - 500 collaborateurs",
    fondation: "2008",
    ca: "18 milliards FCFA",
    valeurs: ["Impact local", "Qualité industrielle", "Développement durable"],
    pourquoiRejoindre:
      "Nous favorisons le développement de l'agro-industrie ivoirienne. Nos équipes à Bouaké bénéficient d'un cadre de travail dynamique favorisant le travail d'équipe et la valorisation du savoir-faire local dans le respect des normes internationales.",
    perks: [
      "Restauration d'entreprise subventionnée",
      "Navettes de transport gratuites",
      "Primes d'intéressement & Bonus de performance",
      "Formations en hygiène & sécurité industrielle",
    ],
  },
  "company-4": {
    taille: "2000+ collaborateurs",
    fondation: "1996",
    ca: "450 milliards FCFA",
    valeurs: ["Audace", "Proximité", "Simplicité", "Partage"],
    pourquoiRejoindre:
      "Orange est l'un des employeurs les plus prisés d'Afrique de l'Ouest. Nous offrons des bureaux ultramodernes au cœur d'Abidjan, une culture forte d'innovation et d'inclusion numérique, de nombreux avantages en nature, et des team-buildings fédérateurs.",
    perks: [
      "Bureaux haut de gamme à Marcory (Abidjan)",
      "Abonnement internet & Téléphonie offert",
      "Primes de fin d'année généreuses",
      "Crèche d'entreprise & Aide à la scolarité",
    ],
  },
  "company-5": {
    taille: "10 - 50 collaborateurs",
    fondation: "2018",
    ca: "600 millions FCFA",
    valeurs: ["Humanisme", "Conseil sur-mesure", "Confidentialité"],
    pourquoiRejoindre:
      "Cabinet à taille humaine, nous mettons le bien-être de nos collaborateurs au cœur de notre modèle. Nous offrons un accompagnement individualisé et des opportunités d'apprentissage accéléré sur l'ensemble des métiers RH en Côte d'Ivoire.",
    perks: [
      "Télétravail partiel possible",
      "Projets variés & Multi-secteurs",
      "Sessions de coaching individuel",
      "Ambiance conviviale & Afterworks réguliers",
    ],
  },
};

const DEFAULT_METADATA: RichMetadata = {
  taille: "50 - 100 collaborateurs",
  fondation: "2020",
  ca: "Non communiqué",
  valeurs: ["Professionnalisme", "Écoute", "Qualité"],
  pourquoiRejoindre:
    "Nous mettons le bien-être de nos collaborateurs au cœur de notre modèle de développement et offrons un cadre de travail de qualité propice à l'apprentissage et à l'évolution de carrière.",
  perks: ["Cadre de travail agréable", "Perspectives d'évolution", "Mutuelle santé"],
};

export const Route = createFileRoute("/entreprises_/$companyId")({
  head: ({ loaderData }) => {
    const data = loaderData as any;
    const title = data?.company?.nom
      ? `${data.company.nom} — Kolori RH`
      : "Profil Entreprise — Kolori RH";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: data?.company?.description || "Profil de l'entreprise partenaire.",
        },
      ],
    };
  },
  loader: async ({ params }) => {
    const companyId = params.companyId;
    try {
      const { data: company } = await supabase
        .from("companies")
        .select("id, nom, logo_url, secteur, localisation, description, site_web")
        .eq("id", companyId)
        .eq("statut", "validee")
        .maybeSingle();

      if (company) {
        return { company };
      }
    } catch (e) {
      console.warn("Loader failed to query Supabase:", e);
    }
    const mockComp = getMockCompanies().find((c) => c.id === companyId) || null;
    return { company: mockComp };
  },
  component: EntrepriseDetailPage,
});

function EntrepriseDetailPage() {
  const { company } = Route.useLoaderData() as { company: CompanyType | null };
  const { companyId } = Route.useParams();
  const [offers, setOffers] = useState<OfferType[] | null>(null);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    if (!company) return;
    (async () => {
      setLoadingOffers(true);
      try {
        const { data, error } = await supabase
          .from("job_offers")
          .select("id, titre, description, contrat, localisation, teletravail, publiee_le")
          .eq("company_id", companyId)
          .eq("statut", "publiee")
          .order("publiee_le", { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setOffers(data as OfferType[]);
        } else {
          const mockOffers = getMockJobOffers().filter((o) => o.company_id === companyId);
          setOffers(mockOffers as any);
        }
      } catch (e) {
        console.warn("Failed to load offers for company from Supabase, trying mock fallback:", e);
        const mockOffers = getMockJobOffers().filter((o) => o.company_id === companyId);
        setOffers(mockOffers as any);
      } finally {
        setLoadingOffers(false);
      }
    })();
  }, [companyId, company]);

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="font-display italic text-3xl mb-2">Entreprise introuvable.</h1>
          <p className="text-muted-foreground text-sm max-w-md mb-8">
            L'entreprise demandée n'existe pas ou n'a pas encore été validée par notre équipe de
            modération.
          </p>
          <Link to="/entreprises">
            <Button className="gap-2 rounded-full">
              <ArrowLeft className="h-4 w-4" /> Retour aux entreprises
            </Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Get rich metadata
  const meta = RICH_COMPANY_DATA[company.id] || DEFAULT_METADATA;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/10">
      <SiteHeader />

      <main className="flex-1">
        {/* Header section (Branded look) */}
        <section className="bg-primary text-primary-foreground border-b border-border/10 py-16 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/5 rounded-full -mr-28 -mb-28 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70 mb-4">
              <Link to="/entreprises" className="hover:text-white transition-colors">
                Entreprises
              </Link>
              <span>/</span>
              <span className="text-white truncate">{company.nom}</span>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={`Logo ${company.nom}`}
                    className="w-20 h-20 rounded-3xl object-cover border border-white/20 bg-white shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20 shadow-md shrink-0">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-white mb-2 leading-none">
                    {company.nom}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-white/80 uppercase tracking-wider">
                    {company.secteur && <span>{company.secteur}</span>}
                    {company.secteur && company.localisation && <span>·</span>}
                    {company.localisation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-accent" /> {company.localisation}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {company.site_web && (
                <a
                  href={
                    company.site_web.startsWith("http")
                      ? company.site_web
                      : `https://${company.site_web}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto"
                >
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-white/25 hover:bg-white/10 hover:text-white text-white font-bold rounded-full px-8 py-3.5 text-sm shadow transition-all"
                  >
                    <Globe className="h-4.5 w-4.5 text-accent" /> Visiter le site web
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-12 w-full">
          {/* Back button */}
          <Link
            to="/entreprises"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Retour aux entreprises
          </Link>

          {/* Two column grid layout */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Main column (Content) */}
            <div className="lg:col-span-8 space-y-10">
              {/* Description Card */}
              {company.description && (
                <div className="bg-white border border-border p-6 md:p-8 rounded-3xl shadow-sm">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
                    À propos de l'entreprise
                  </h2>
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                    {company.description}
                  </p>
                </div>
              )}

              {/* Core Values Card */}
              <div className="bg-white border border-border p-6 md:p-8 rounded-3xl shadow-sm">
                <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> Nos valeurs cardinales
                </h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  {meta.valeurs.map((v, i) => (
                    <div
                      key={i}
                      className="flex flex-col p-4 bg-muted/30 border border-border/40 rounded-2xl"
                    >
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-3">
                        <Heart className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="font-display font-bold text-sm text-foreground mb-1">{v}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Inscrite au cœur de notre fonctionnement et de notre culture d'entreprise au
                        quotidien.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits & Perks Card */}
              <div className="bg-white border border-border p-6 md:p-8 rounded-3xl shadow-sm">
                <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Pourquoi nous rejoindre ?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {meta.pourquoiRejoindre}
                </p>
                <div className="grid sm:grid-cols-2 gap-3.5 pt-2 border-t border-border/40">
                  {meta.perks.map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold text-foreground leading-snug">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job listings (Offres d'emploi) */}
              <section className="animate-reveal [animation-delay:100ms] space-y-6">
                <h2 className="font-display italic text-3xl text-primary">
                  Offres d'emploi actives
                </h2>

                {loadingOffers ? (
                  <div className="text-sm font-mono text-muted-foreground">
                    Chargement des offres…
                  </div>
                ) : offers && offers.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-border bg-card rounded-3xl">
                    <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-display font-bold text-lg mb-1">
                      Aucune offre d'emploi active
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Cette entreprise n'a pas de poste à pourvoir actuellement.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {offers?.map((o) => (
                      <Link
                        key={o.id}
                        to="/offres/$offerId"
                        params={{ offerId: o.id }}
                        className="block p-6 bg-white border border-border rounded-2xl hover:shadow-xl hover:border-primary/20 transition-all group"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <h3 className="font-display font-bold text-xl text-primary group-hover:text-accent transition-colors leading-tight">
                            {o.titre}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="font-semibold px-3 py-1 text-xs uppercase rounded-full tracking-wide bg-secondary text-secondary-foreground border border-border/40"
                          >
                            {o.contrat}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2 mb-4 leading-relaxed">
                          {o.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
                          {o.localisation && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary" /> {o.localisation}
                            </span>
                          )}
                          {o.teletravail && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5 text-primary" />
                              {typeof o.teletravail === "boolean"
                                ? o.teletravail
                                  ? "Télétravail"
                                  : "Présentiel"
                                : o.teletravail}
                            </span>
                          )}
                          {o.publiee_le && (
                            <span className="flex items-center gap-1 font-mono text-[10px] uppercase">
                              <Calendar className="h-3.5 w-3.5 text-primary" /> Publiée le{" "}
                              {new Date(o.publiee_le).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right sidebar (Specs and office look) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Tech Spec Card */}
              <div className="bg-white border border-border rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-display font-bold text-lg text-foreground pb-2 border-b border-border">
                  Fiche Technique
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        Taille
                      </div>
                      <span className="text-xs font-bold text-foreground leading-snug">
                        {meta.taille}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <Calendar className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        Fondation
                      </div>
                      <span className="text-xs font-bold text-foreground leading-snug">
                        {meta.fondation}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <Coins className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        Chiffre d'affaires
                      </div>
                      <span className="text-xs font-bold text-foreground leading-snug">
                        {meta.ca}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        Localisation
                      </div>
                      <span className="text-xs font-bold text-foreground leading-snug">
                        {company.localisation || "Non communiquée"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office/Vibe visual box */}
              <div className="rounded-3xl overflow-hidden shadow-sm border border-border/60 bg-white p-3 space-y-3">
                <div className="rounded-2xl overflow-hidden aspect-[4/3] relative">
                  <img
                    src="/contact_office.png"
                    alt="Bureaux d'entreprise"
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-bold font-mono tracking-widest uppercase">
                      Espace de travail
                    </span>
                  </div>
                </div>
                <div className="px-1 py-1">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Un cadre de travail moderne situé dans les meilleurs quartiers d'affaires de
                    Côte d'Ivoire, pensé pour le confort et la performance des collaborateurs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
