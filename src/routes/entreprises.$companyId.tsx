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
    const data = loaderData as any;
    const title = data?.company?.nom ? `${data.company.nom} — Kolori RH` : "Profil Entreprise — Kolori RH";
    return {
      meta: [
        { title },
        { name: "description", content: data?.company?.description || "Profil de l'entreprise partenaire." },
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
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Header section (Branded look) */}
        <section className="bg-primary text-primary-foreground border-b border-border/10 py-12 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/5 rounded-full -mr-28 -mb-28 pointer-events-none" />
          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70 mb-4">
              <Link to="/entreprises" className="hover:text-white transition-colors">Entreprises</Link>
              <span>/</span>
              <span className="text-white truncate">{company.nom}</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={`Logo ${company.nom}`}
                    className="w-20 h-20 rounded-2xl object-cover border border-white/20 bg-white shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-md">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="font-display font-black text-3xl md:text-4xl tracking-tight text-white mb-2">
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
                  href={company.site_web.startsWith("http") ? company.site_web : `https://${company.site_web}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto"
                >
                  <Button variant="outline" className="w-full gap-2 border-white/20 hover:bg-white/10 hover:text-white text-white font-semibold rounded-full px-6 py-2.5">
                    <Globe className="h-4 w-4 text-accent" /> Visiter le site
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-6 py-12 w-full">
          {/* Back button */}
          <Link to="/entreprises" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Retour aux entreprises
          </Link>

          {company.description && (
            <div className="bg-white border border-border p-6 md:p-8 rounded-3xl shadow-sm mb-12">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">À propos de l'entreprise</h2>
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                {company.description}
              </p>
            </div>
          )}

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
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
