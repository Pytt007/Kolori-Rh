import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_COMPANIES, MOCK_JOB_OFFERS, getMockCompanies, getMockJobOffers } from "@/lib/mockData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Briefcase, Building2, Calendar, ArrowLeft } from "lucide-react";

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

export const Route = createFileRoute("/entreprises/$companyId")({
  head: ({ loaderData }) => {
    const title = loaderData?.company?.nom ? `${loaderData.company.nom} — Kolori RH` : "Profil Entreprise — Kolori RH";
    return {
      meta: [
        { title },
        { name: "description", content: loaderData?.company?.description || "Profil de l'entreprise partenaire." },
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
    const mockComp = getMockCompanies().find(c => c.id === companyId) || null;
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
          const mockOffers = getMockJobOffers().filter(o => o.company_id === companyId);
          setOffers(mockOffers as any);
        }
      } catch (e) {
        console.warn("Failed to load offers for company from Supabase, trying mock fallback:", e);
        const mockOffers = getMockJobOffers().filter(o => o.company_id === companyId);
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
            L'entreprise demandée n'existe pas ou n'a pas encore été validée par notre équipe de modération.
          </p>
          <Link to="/entreprises">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Retour aux entreprises
            </Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        {/* Fil d'ariane / Bouton retour */}
        <Link to="/entreprises" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Retour aux entreprises
        </Link>

        {/* En-tête Profil */}
        <section className="bg-card border border-border p-8 rounded-sm mb-8 animate-reveal">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-5">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={`Logo ${company.nom}`}
                  className="w-20 h-20 rounded-sm object-cover border border-border bg-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-sm bg-secondary flex items-center justify-center border border-border">
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="font-display italic text-4xl mb-1 leading-tight text-primary">{company.nom}</h1>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {company.secteur && <span>{company.secteur}</span>}
                  {company.secteur && company.localisation && <span>·</span>}
                  {company.localisation && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {company.localisation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {company.site_web && (
              <a
                href={company.site_web.startsWith("http") ? company.site_web : `https://${company.site_web}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto"
              >
                <Button variant="outline" className="w-full gap-2 font-mono uppercase tracking-wider text-xs">
                  <Globe className="h-4 w-4" /> Visiter le site
                </Button>
              </a>
            )}
          </div>

          {company.description && (
            <div className="mt-8 pt-8 border-t border-border/50">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">À propos de l'entreprise</h2>
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                {company.description}
              </p>
            </div>
          )}
        </section>

        {/* Offres de l'entreprise */}
        <section className="animate-reveal [animation-delay:100ms]">
          <h2 className="font-display italic text-3xl mb-6">Offres en cours.</h2>

          {loadingOffers ? (
            <div className="text-sm font-mono text-muted-foreground">Chargement des offres…</div>
          ) : offers && offers.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border bg-card rounded-sm">
              <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-display italic text-xl mb-1">Aucune offre d'emploi active.</p>
              <p className="text-muted-foreground text-sm">
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
                  className="block p-6 bg-card border border-border rounded-sm hover:border-primary transition-colors group"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <h3 className="font-display italic text-2xl text-primary group-hover:text-accent transition-colors">{o.titre}</h3>
                    <Badge variant="outline" className="font-mono uppercase text-xs">{o.contrat}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{o.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    {o.localisation && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {o.localisation}</span>}
                    {o.teletravail && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {o.teletravail}</span>}
                    {o.publiee_le && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Publiée le {new Date(o.publiee_le).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
