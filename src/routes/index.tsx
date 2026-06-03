import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_JOB_OFFERS, getMockJobOffers } from "@/lib/mockData";
import {
  Briefcase,
  Users,
  Settings,
  Scale,
  ArrowRight,
  Search,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kolori RH — Votre avenir, nos couleurs." },
      {
        name: "description",
        content:
          "Cabinet conseil en recrutement, externalisation des ressources humaines, solutions de gestion des talents et conformité sociale.",
      },
    ],
  }),
  component: Index,
});

type JobOffer = {
  id: string;
  titre: string;
  description: string;
  contrat: string;
  localisation: string | null;
  publiee_le: string | null;
};

function Index() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [lieu, setLieu] = useState("");
  const [recentOffers, setRecentOffers] = useState<JobOffer[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      subtitle: "Recrutement & Solutions RH",
      title: (
        <>
          Votre carrière,
          <br />
          nos <span className="text-accent">couleurs.</span>
        </>
      ),
      description:
        "Nous connectons les professionnels d'élite aux entreprises visionnaires à travers des solutions d'évaluation de pointe et une expertise RH de haut niveau en Côte d'Ivoire.",
      image: "/hero_recruitment.png",
      cta1Text: "Rechercher un Emploi",
      cta1Link: "/offres",
      cta2Text: "Déposer votre CV",
      cta2Link: "/inscription",
      cta2Search: { role: "candidat" },
    },
    {
      subtitle: "Évaluation & Assessment",
      title: (
        <>
          Identifiez les
          <br />
          meilleurs <span className="text-accent">talents.</span>
        </>
      ),
      description:
        "Révélez le potentiel de vos collaborateurs grâce à nos tests psychométriques et évaluations de compétences rigoureuses et personnalisées.",
      image: "/candidate_success.png",
      cta1Text: "Découvrir nos Services",
      cta1Link: "/services/tests-psychometriques",
      cta2Text: "Nous Contacter",
      cta2Link: "/contact",
      cta2Search: undefined,
    },
    {
      subtitle: "Gestion de la Paie & Social",
      title: (
        <>
          Externalisez pour
          <br />
          plus de <span className="text-accent">sécurité.</span>
        </>
      ),
      description:
        "Libérez-vous de la gestion administrative complexe et assurez une conformité totale de la paie et des obligations sociales de votre entreprise.",
      image: "/mission_collaboration.png",
      cta1Text: "Nos Solutions de Paie",
      cta1Link: "/services/gestion-de-la-paie",
      cta2Text: "Demander un Devis",
      cta2Link: "/contact",
      cta2Search: undefined,
    },
  ];

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("job_offers")
          .select("id, titre, description, contrat, localisation, publiee_le")
          .eq("statut", "publiee")
          .order("publiee_le", { ascending: false })
          .limit(2);
        if (error) throw error;
        if (data && data.length > 0) {
          setRecentOffers(data as JobOffer[]);
        } else {
          setRecentOffers(getMockJobOffers().slice(0, 2) as any);
        }
      } catch (e) {
        console.warn(
          "Failed to load recent offers on homepage from Supabase, trying mock fallback:",
          e,
        );
        setRecentOffers(getMockJobOffers().slice(0, 2) as any);
      }
    })();
  }, []);

  // Slide Auto-play Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/offres", search: { q, lieu, contrat: "" } as never });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/10">
      <SiteHeader />

      {/* 1. Hero Section Slider */}
      <section className="relative pt-12 pb-20 md:py-24 overflow-hidden min-h-[580px] flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full relative">
          <div key={currentSlide} className="grid md:grid-cols-12 gap-12 items-center">
            {/* Left Text */}
            <div className="md:col-span-6 space-y-6 z-10 animate-reveal">
              <span className="text-xs uppercase tracking-widest text-accent font-bold">
                {slides[currentSlide].subtitle}
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight leading-[1.05] text-foreground">
                {slides[currentSlide].title}
              </h1>
              <p className="max-w-md text-base text-muted-foreground leading-relaxed">
                {slides[currentSlide].description}
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to={slides[currentSlide].cta1Link as any}
                  className="bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-full hover:brightness-110 shadow-md hover:shadow-lg transition-all text-sm"
                >
                  {slides[currentSlide].cta1Text}
                </Link>
                <Link
                  to={slides[currentSlide].cta2Link as any}
                  search={slides[currentSlide].cta2Search as any}
                  className="bg-white border border-border text-foreground font-semibold px-8 py-3.5 rounded-full hover:bg-secondary transition-colors text-sm"
                >
                  {slides[currentSlide].cta2Text}
                </Link>
              </div>
            </div>

            {/* Right Visual Frame */}
            <div className="md:col-span-6 flex justify-center relative animate-reveal [animation-delay:150ms]">
              <div className="absolute -bottom-6 left-1/4 w-32 h-32 bg-accent rounded-full -z-10 shadow-lg transform -translate-x-12 opacity-80" />
              <div className="absolute -top-6 right-1/4 w-12 h-12 border-4 border-muted rounded-full -z-10 opacity-60" />

              <div className="relative rounded-3xl overflow-hidden shadow-2xl w-full max-w-md border-4 border-white aspect-[4/3]">
                <img
                  src={slides[currentSlide].image}
                  alt="Kolori RH Banner"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Slider controls (Arrows) */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full border border-border bg-white/95 text-foreground hover:bg-secondary shadow-md transition-all hidden md:flex items-center justify-center -translate-x-4 hover:-translate-x-5 z-20 cursor-pointer"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full border border-border bg-white/95 text-foreground hover:bg-secondary shadow-md transition-all hidden md:flex items-center justify-center translate-x-4 hover:translate-x-5 z-20 cursor-pointer"
            aria-label="Slide suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator Dots */}
          <div className="flex justify-center gap-2 mt-12 md:mt-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === index
                    ? "w-8 bg-accent"
                    : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Partners Bar */}
      <section className="bg-white border-y border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground font-bold mb-8">
            Les entreprises qui grandissent avec nous
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-50 grayscale hover:opacity-85 transition-opacity">
            <span className="text-2xl font-black tracking-tighter text-foreground">UBER</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">NIVEA</span>
            <span className="text-2xl font-semibold text-foreground">BOMBARDIER</span>
            <span className="text-2xl font-mono font-bold tracking-widest text-foreground">
              SAP
            </span>
            <span className="text-2xl font-serif font-black text-foreground">UNILEVER</span>
            <span className="text-2xl font-sans font-extrabold text-foreground">CINNABON</span>
          </div>
        </div>
      </section>

      {/* 3. Nos Services RH & Recrutement */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-12 gap-16 items-start">
        {/* Left Intro Card */}
        <div className="lg:col-span-5 space-y-6 animate-reveal">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">
            SOLUTIONS
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">
            Nos Services de Recrutement & RH
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Notre mission est de fournir à nos clients des solutions de recrutement et de ressources
            humaines de classe mondiale, tout en respectant des normes élevées d'intégrité, de
            confiance et de professionnalisme.
          </p>
          <div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full hover:brightness-110 transition-all text-sm"
            >
              À Propos de Nous <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Services Grid */}
        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6 animate-reveal [animation-delay:100ms]">
          {/* Card 1 */}
          <div className="bg-white p-8 border border-border rounded-2xl hover:shadow-xl hover:border-primary/20 transition-all group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">Recrutement de Cadres</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Identification et sélection de leaders hautement qualifiés pour guider votre
              structure.
            </p>
            <Link
              to="/services/$serviceId"
              params={{ serviceId: "chasse-de-tetes" }}
              className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
            >
              En savoir plus <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 border border-border rounded-2xl hover:shadow-xl hover:border-primary/20 transition-all group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">Administration des RH</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Gestion de la paie, conformité légale et contrats pour simplifier votre quotidien RH.
            </p>
            <Link
              to="/services/$serviceId"
              params={{ serviceId: "gestion-de-la-paie" }}
              className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
            >
              En savoir plus <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 border border-border rounded-2xl hover:shadow-xl hover:border-primary/20 transition-all group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">Systèmes RH</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Mise en œuvre d'outils et SIRH modernes pour piloter la performance de vos équipes.
            </p>
            <Link
              to="/services/$serviceId"
              params={{ serviceId: "systemes-rh" }}
              className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
            >
              En savoir plus <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-8 border border-border rounded-2xl hover:shadow-xl hover:border-primary/20 transition-all group">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">Droit du Travail</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Conseils réglementaires et veille juridique pour sécuriser vos démarches sociales.
            </p>
            <Link
              to="/services/$serviceId"
              params={{ serviceId: "droit-du-travail" }}
              className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
            >
              En savoir plus <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Split Mission Banner (Red Left / Image Right) */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">
          {/* Left Red Block */}
          <div className="bg-primary text-primary-foreground p-12 lg:p-20 flex flex-col justify-center space-y-6">
            <span className="text-xs uppercase tracking-widest text-primary-foreground/80 font-bold">
              MISSION
            </span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold leading-tight">
              Des solutions adaptées à vos besoins
            </h2>
            <p className="text-sm opacity-90 leading-relaxed max-w-md">
              Notre Mission est de fournir à nos clients des solutions RH et de management de classe
              mondiale, fondées sur l'intégrité, la confiance et le professionnalisme.
            </p>
            <div>
              <Link
                to="/contact"
                className="inline-block bg-white text-primary font-bold px-8 py-3 rounded-full hover:bg-neutral-100 transition-colors text-sm shadow"
              >
                En savoir plus
              </Link>
            </div>
          </div>

          {/* Right Image Block */}
          <div className="h-[300px] md:h-auto min-h-[350px] relative">
            <img
              src="/mission_collaboration.png"
              alt="Collaboration équipe Kolori RH"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 5. Sélection Candidats Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-12 gap-16 items-center">
        {/* Left Side: Image with floating badge */}
        <div className="md:col-span-6 relative animate-reveal">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl max-w-md mx-auto">
            <img
              src="/candidate_success.png"
              alt="Candidat sélectionné avec succès"
              className="object-cover w-full h-[450px]"
            />

            {/* Floating metrics box */}
            <div className="absolute bottom-6 right-6 bg-white p-5 rounded-2xl shadow-xl border border-border flex flex-col items-center text-center">
              <span className="text-3xl font-display font-black text-primary">3500+</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                Collaborateurs Placés
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Text description */}
        <div className="md:col-span-6 space-y-6 animate-reveal [animation-delay:100ms]">
          <span className="text-xs uppercase tracking-widest text-accent font-bold">KOLORI</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight">
            Nous sélectionnons les bons candidats pour faire grandir votre entreprise
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Notre équipe adopte une approche proactive en matière de recrutement et de placement, en
            mettant l'accent sur une communication transparente avec le client et les candidats
            potentiels afin de bien comprendre leurs attentes, créant ainsi une situation
            gagnant-gagnant pour tous.
          </p>
          <div>
            <Link
              to="/entreprises"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-full hover:brightness-110 transition-all text-sm"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Recherche d'emploi & Annonces */}
      <section className="bg-muted/30 border-y border-border py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-start">
          {/* Left panel search & upload */}
          <div className="lg:col-span-5 space-y-6 animate-reveal">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              RECHERCHE D'EMPLOI
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight">
              Quel emploi recherchez-vous ?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Consultez nos opportunités de carrière récentes ou transmettez-nous directement votre
              curriculum vitae pour nos futures opportunités.
            </p>

            {/* Search form integration */}
            <form onSubmit={onSearch} className="space-y-3 max-w-sm pt-2">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Poste, mots-clés..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full bg-white border border-border pl-11 pr-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ville ou Télétravail..."
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                  className="w-full bg-white border border-border pl-11 pr-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-full hover:brightness-110 transition-all text-sm shadow-md"
              >
                Lancer la recherche
              </button>
            </form>

            <div className="pt-2">
              <Link
                to="/inscription"
                search={{ role: "candidat" } as never}
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                Déposer votre CV maintenant →
              </Link>
            </div>
          </div>

          {/* Right panel: Recent offers */}
          <div className="lg:col-span-7 space-y-6 animate-reveal [animation-delay:100ms]">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Offres d'emploi récentes
              </span>
              <Link to="/offres" className="text-xs font-bold text-primary hover:underline">
                Voir toutes les offres
              </Link>
            </div>

            {recentOffers.length === 0 ? (
              <div className="p-8 bg-white border border-border rounded-2xl text-center text-sm text-muted-foreground">
                Aucune offre publiée pour le moment.
              </div>
            ) : (
              <div className="grid gap-4">
                {recentOffers.map((o) => (
                  <Link
                    key={o.id}
                    to="/offres/$offerId"
                    params={{ offerId: o.id }}
                    className="block p-6 bg-white border border-border rounded-2xl hover:shadow-xl hover:border-primary/20 transition-all group"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">
                          {o.publiee_le
                            ? new Date(o.publiee_le).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "Récemment"}
                        </span>
                        <h3 className="font-display font-bold text-xl text-primary group-hover:text-accent transition-colors">
                          {o.titre}
                        </h3>
                      </div>
                      <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full uppercase">
                        {o.contrat}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs line-clamp-2 mb-4 leading-relaxed">
                      {o.description}
                    </p>
                    <div className="flex items-center justify-between">
                      {o.localisation && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-primary" /> {o.localisation}
                        </span>
                      )}
                      <span className="text-xs font-bold text-primary inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Postuler maintenant →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
