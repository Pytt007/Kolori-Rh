import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MOCK_JOB_OFFERS,
  MOCK_COMPANIES,
  getMockJobOffers,
  getMockCompanies,
} from "@/lib/mockData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Building2, Calendar, Euro } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PostulerDialog } from "@/components/site/PostulerDialog";

type OfferDetail = {
  id: string;
  titre: string;
  description: string;
  contrat: string;
  localisation: string | null;
  teletravail: string | null;
  salaire_min: number | null;
  salaire_max: number | null;
  publiee_le: string | null;
  secteur: string | null;
  competences_requises: string[] | string | null;
  company: {
    nom: string;
    secteur: string | null;
    logo_url: string | null;
    localisation: string | null;
  } | null;
};

export const Route = createFileRoute("/offres_/$offerId")({
  head: () => ({
    meta: [
      { title: "Offre d'emploi — Kolori RH" },
      { name: "description", content: "Détails de l'offre d'emploi." },
    ],
  }),
  component: OfferDetailPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="font-display italic text-3xl mb-2">Offre introuvable.</p>
        <Link to="/offres" className="text-primary underline">
          Voir toutes les offres
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center text-destructive">
      Erreur : {error.message}
    </div>
  ),
});

function OfferDetailPage() {
  const { offerId } = Route.useParams();
  const { isAuthenticated, hasRole } = useAuth();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [relatedOffers, setRelatedOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("job_offers")
          .select(
            "id, titre, description, contrat, localisation, teletravail, salaire_min, salaire_max, publiee_le, secteur, competences_requises, company:companies(nom, secteur, logo_url, localisation)",
          )
          .eq("id", offerId)
          .eq("statut", "publiee")
          .maybeSingle();
        if (error) throw error;

        let finalOffer: any = data;
        if (!finalOffer) {
          // Fallback to mock data
          const mockOff = getMockJobOffers().find((o) => o.id === offerId);
          if (mockOff) {
            const comp = getMockCompanies().find((c) => c.id === mockOff.company_id);
            finalOffer = {
              ...mockOff,
              company: comp
                ? {
                    nom: comp.nom,
                    secteur: comp.secteur,
                    logo_url: comp.logo_url,
                    localisation: comp.localisation,
                  }
                : null,
            };
          }
        }

        if (!finalOffer) {
          setNotFoundState(true);
        } else {
          // Ensure competences_requises is an array
          if (
            finalOffer.competences_requises &&
            typeof finalOffer.competences_requises === "string"
          ) {
            finalOffer.competences_requises = finalOffer.competences_requises
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
          }
          setOffer(finalOffer as unknown as OfferDetail);

          // Fetch related offers
          try {
            const { data: related } = await supabase
              .from("job_offers")
              .select("id, titre, description, contrat, localisation, publiee_le")
              .eq("statut", "publiee")
              .neq("id", offerId)
              .limit(3);
            if (related && related.length > 0) {
              setRelatedOffers(related);
            } else {
              const mockRelated = getMockJobOffers()
                .filter((o) => o.id !== offerId)
                .slice(0, 3);
              setRelatedOffers(mockRelated);
            }
          } catch (e) {
            const mockRelated = getMockJobOffers()
              .filter((o) => o.id !== offerId)
              .slice(0, 3);
            setRelatedOffers(mockRelated);
          }
        }
      } catch (e) {
        console.warn("Failed to load offer details from Supabase, trying mock fallback:", e);
        const mockOff = getMockJobOffers().find((o) => o.id === offerId);
        if (mockOff) {
          const comp = getMockCompanies().find((c) => c.id === mockOff.company_id);
          const finalOffer: any = {
            ...mockOff,
            company: comp
              ? {
                  nom: comp.nom,
                  secteur: comp.secteur,
                  logo_url: comp.logo_url,
                  localisation: comp.localisation,
                }
              : null,
          };
          if (
            finalOffer.competences_requises &&
            typeof finalOffer.competences_requises === "string"
          ) {
            finalOffer.competences_requises = finalOffer.competences_requises
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
          }
          setOffer(finalOffer as unknown as OfferDetail);
          const mockRelated = getMockJobOffers()
            .filter((o) => o.id !== offerId)
            .slice(0, 3);
          setRelatedOffers(mockRelated);
        } else {
          setNotFoundState(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [offerId]);

  if (notFoundState) throw notFound();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <SiteHeader />
      <main className="flex-1 pb-24">
        {loading || !offer ? (
          <div className="max-w-7xl mx-auto px-6 py-20 text-muted-foreground font-mono text-sm">
            Chargement de l'offre d'emploi...
          </div>
        ) : (
          <>
            {/* Header section (Mockup breadcrumb look) */}
            <section className="bg-primary text-primary-foreground border-b border-border/10 py-12 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/5 rounded-full -mr-28 -mb-28 pointer-events-none" />
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/70 mb-4">
                  <Link to="/offres" className="hover:text-white transition-colors">
                    Offres d'emploi
                  </Link>
                  <span>/</span>
                  <span className="text-white/60">{offer.secteur || "Recrutement"}</span>
                  <span>/</span>
                  <span className="text-white truncate">{offer.titre}</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="font-display font-black text-3xl md:text-4xl tracking-tight text-white">
                      {offer.titre}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-white/80 mt-2 uppercase tracking-wider">
                      <span>
                        Publiée le{" "}
                        {offer.publiee_le
                          ? new Date(offer.publiee_le).toLocaleDateString("fr-FR")
                          : "Récemment"}
                      </span>
                      {offer.company && <span>• {offer.company.nom}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-4 py-1.5 bg-white/10 text-white text-xs font-bold rounded-full uppercase tracking-wider border border-white/20">
                      {offer.contrat}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Split layout: Details vs Description */}
            <section className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-10 items-start">
              {/* Left sidebar: Details Card */}
              <div className="lg:col-span-4 bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-display font-bold text-lg mb-4 pb-2 border-b border-border">
                  Détails du poste
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                  {offer.company ? (
                    <span>
                      Une entreprise de premier plan du secteur{" "}
                      <strong>{offer.company.secteur || "activité"}</strong> recrute actuellement un
                      profil qualifié de <strong>{offer.titre}</strong> pour renforcer ses équipes à{" "}
                      {offer.localisation || "Abidjan"}.
                    </span>
                  ) : (
                    <span>
                      Nous recrutons actuellement pour le poste de {offer.titre}. Consultez la
                      description complète et déposez votre candidature ci-dessous.
                    </span>
                  )}
                </p>

                {/* Job metadata list */}
                <ul className="space-y-3.5 text-xs mb-8">
                  {offer.localisation && (
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        <strong>Localisation :</strong> {offer.localisation}
                      </span>
                    </li>
                  )}
                  {offer.teletravail && (
                    <li className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        <strong>Télétravail :</strong> {offer.teletravail}
                      </span>
                    </li>
                  )}
                  {(offer.salaire_min || offer.salaire_max) && (
                    <li className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        <strong>Salaire :</strong> {offer.salaire_min ?? "?"}k –{" "}
                        {offer.salaire_max ?? "?"}k / an
                      </span>
                    </li>
                  )}
                </ul>

                {/* Action button: Apply */}
                <div className="pt-6 border-t border-border flex flex-col gap-3">
                  {isAuthenticated && hasRole("candidat") ? (
                    <PostulerDialog offerId={offer.id} offerTitle={offer.titre} />
                  ) : (
                    <div className="bg-gradient-to-br from-primary/[0.03] to-primary/[0.07] border border-primary/10 rounded-2xl p-5 shadow-sm text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 pointer-events-none" />

                      <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                        <Briefcase className="w-5 h-5" />
                      </div>

                      <h4 className="font-display font-bold text-sm text-foreground mb-2">
                        Prêt à propulser votre carrière ?
                      </h4>

                      <p className="text-xs text-muted-foreground leading-relaxed mb-5 px-1">
                        Pour postuler à ce poste et échanger directement avec les recruteurs en Côte
                        d'Ivoire, créez votre profil candidat en quelques clics.
                      </p>

                      <div className="space-y-3 relative z-10">
                        <Link
                          to="/inscription"
                          search={{ role: "candidat" } as any}
                          className="w-full inline-flex items-center justify-center bg-primary text-primary-foreground py-2.5 px-4 text-xs font-bold rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all text-center tracking-wide"
                        >
                          S'inscrire comme Candidat
                        </Link>

                        <div className="pt-2 flex items-center justify-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">Déjà un compte ?</span>
                          <Link to="/connexion" className="font-bold text-primary hover:underline">
                            Se connecter
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right area: Description and Requirements */}
              <div className="lg:col-span-8 space-y-10">
                {/* Description */}
                <div>
                  <h2 className="font-display font-bold text-2xl mb-4 text-foreground">
                    Description du poste
                  </h2>
                  <div className="prose prose-stone max-w-none text-foreground/80 leading-relaxed text-sm whitespace-pre-wrap bg-white border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    {offer.description}
                  </div>
                </div>

                {/* Requirements */}
                {offer.competences_requises && (
                  <div>
                    <h2 className="font-display font-bold text-2xl mb-4 text-foreground">
                      Compétences recherchées
                    </h2>
                    <div className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                      <div className="flex flex-wrap gap-2.5">
                        {Array.isArray(offer.competences_requises)
                          ? offer.competences_requises.map((c) => (
                              <Badge
                                key={c}
                                variant="secondary"
                                className="bg-primary/5 text-primary border border-primary/10 font-medium py-1 px-3 rounded-full text-xs"
                              >
                                {c}
                              </Badge>
                            ))
                          : typeof offer.competences_requises === "string"
                            ? offer.competences_requises
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                                .map((c) => (
                                  <Badge
                                    key={c}
                                    variant="secondary"
                                    className="bg-primary/5 text-primary border border-primary/10 font-medium py-1 px-3 rounded-full text-xs"
                                  >
                                    {c}
                                  </Badge>
                                ))
                            : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Red Contact banner (Mockup 2 looking banner) */}
            <section className="max-w-7xl mx-auto px-6 py-8">
              <div className="bg-accent text-accent-foreground rounded-3xl p-10 md:p-12 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16" />

                <div className="space-y-2 z-10 text-center md:text-left">
                  <span className="text-xs uppercase tracking-widest text-accent-foreground/80 font-bold">
                    RESTEZ EN CONTACT
                  </span>
                  <h2 className="text-2xl md:text-3xl font-display font-bold">
                    Des questions sur ce poste ?
                  </h2>
                  <p className="text-sm opacity-90">
                    Notre équipe de consultants en recrutement est là pour vous guider.
                  </p>
                </div>

                <div className="z-10 bg-white/10 hover:bg-white/20 border border-white/25 rounded-2xl px-6 py-4 transition-colors font-mono font-bold text-sm">
                  contact@kolorirh.com
                </div>
              </div>
            </section>

            {/* Related Jobs Section */}
            {relatedOffers.length > 0 && (
              <section className="max-w-7xl mx-auto px-6 py-16 border-t border-border mt-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="font-display font-bold text-2xl">Offres d'emploi similaires</h2>
                  <Link to="/offres" className="text-xs font-bold text-primary hover:underline">
                    Toutes les offres →
                  </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {relatedOffers.map((ro) => (
                    <Link
                      key={ro.id}
                      to="/offres/$offerId"
                      params={{ offerId: ro.id }}
                      className="bg-white border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/20 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            {ro.publiee_le
                              ? new Date(ro.publiee_le).toLocaleDateString("fr-FR")
                              : "Récemment"}
                          </span>
                          <span className="px-2.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full uppercase">
                            {ro.contrat}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-primary group-hover:text-accent transition-colors leading-snug mb-2">
                          {ro.titre}
                        </h3>
                        <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed mb-4">
                          {ro.description}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-border/40 text-xs font-bold text-primary">
                        <span>{ro.localisation || ""}</span>
                        <span>Voir l'offre →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
