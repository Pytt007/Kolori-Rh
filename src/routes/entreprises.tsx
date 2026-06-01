import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_COMPANIES, MOCK_JOB_OFFERS, getMockCompanies, getMockJobOffers } from "@/lib/mockData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Globe, Building2, Briefcase } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  lieu: z.string().optional().catch(""),
});

type CompanyRow = {
  id: string;
  nom: string;
  logo_url: string | null;
  secteur: string | null;
  localisation: string | null;
  description: string | null;
  site_web: string | null;
  job_offers: { id: string; statut: string }[];
};

export const Route = createFileRoute("/entreprises")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entreprises partenaires — Kolori RH" },
      { name: "description", content: "Découvrez les entreprises partenaires qui recrutent sur la plateforme Kolori RH." },
      { property: "og:title", content: "Entreprises partenaires — Kolori RH" },
      { property: "og:description", content: "Découvrez les entreprises partenaires qui recrutent sur Kolori RH." },
    ],
  }),
  component: EntreprisesPage,
});

function EntreprisesPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [lieu, setLieu] = useState(search.lieu ?? "");
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Récupérer toutes les entreprises validées et leurs offres publiées
      let query = supabase
        .from("companies")
        .select(`
          id,
          nom,
          logo_url,
          secteur,
          localisation,
          description,
          site_web,
          job_offers(id, statut)
        `)
        .eq("statut", "validee")
        .order("nom", { ascending: true });

      if (search.q) {
        query = query.or(`nom.ilike.%${search.q}%,secteur.ilike.%${search.q}%`);
      }
      if (search.lieu) {
        query = query.ilike("localisation", `%${search.lieu}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error(error);
      }
      if (data && data.length > 0) {
        setCompanies(data as any);
      } else {
        // Fallback to mock companies
        let filtered = [...getMockCompanies()];
        if (search.q) {
          const qLower = search.q.toLowerCase();
          filtered = filtered.filter(c => c.nom.toLowerCase().includes(qLower) || (c.secteur && c.secteur.toLowerCase().includes(qLower)));
        }
        if (search.lieu) {
          const lieuLower = search.lieu.toLowerCase();
          filtered = filtered.filter(c => c.localisation?.toLowerCase().includes(lieuLower));
        }
        
        const mapped = filtered.map(c => ({
          ...c,
          job_offers: getMockJobOffers().filter(o => o.company_id === c.id).map(o => ({ id: o.id, statut: o.statut }))
        }));
        setCompanies(mapped as any);
      }
      setLoading(false);
    })();
  }, [search.q, search.lieu]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground border-b border-border/10 py-16 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mb-32 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-xs font-mono uppercase tracking-widest text-white/70 mb-3">Partenaires</div>
            <h1 className="font-display italic text-5xl mb-8 text-white">Les Entreprises.</h1>
            
            <form
              className="grid md:grid-cols-[1fr_1fr_auto] gap-2 p-2 bg-white ring-1 ring-border shadow-md max-w-4xl rounded-2xl md:rounded-full items-center text-black"
              onSubmit={(e) => {
                e.preventDefault();
                const url = new URL(window.location.href);
                url.searchParams.set("q", q);
                url.searchParams.set("lieu", lieu);
                window.history.pushState({}, "", url.toString());
                window.location.reload();
              }}
            >
              <div className="flex items-center px-4 border-b md:border-b-0 md:border-r border-border w-full">
                <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <input 
                  type="text"
                  className="w-full bg-transparent text-sm focus:outline-none placeholder-muted-foreground py-2.5" 
                  placeholder="Nom de l'entreprise, secteur d'activité…" 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                />
              </div>
              <div className="flex items-center px-4 w-full">
                <MapPin className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <input 
                  type="text"
                  className="w-full bg-transparent text-sm focus:outline-none placeholder-muted-foreground py-2.5" 
                  placeholder="Localisation…" 
                  value={lieu} 
                  onChange={(e) => setLieu(e.target.value)} 
                />
              </div>
              <Button type="submit" className="rounded-full px-6 py-2.5 bg-primary text-primary-foreground font-semibold hover:brightness-110 shadow-md">Rechercher</Button>
            </form>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">
            {loading ? "Chargement…" : `${companies?.length ?? 0} entreprise(s)`}
          </div>

          {!loading && companies && companies.length === 0 && (
            <div className="text-center py-24 border border-dashed border-border rounded-sm">
              <p className="font-display italic text-2xl mb-2">Aucune entreprise partenaire trouvée.</p>
              <p className="text-muted-foreground text-sm">Modifiez vos critères de recherche pour obtenir plus de résultats.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies?.map((c) => {
              const activeOffersCount = c.job_offers
                ? c.job_offers.filter((o) => o.statut === "publiee").length
                : 0;

              return (
                <div
                  key={c.id}
                  className="bg-card border border-border rounded-sm hover:border-primary transition-all p-6 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      {c.logo_url ? (
                        <img
                          src={c.logo_url}
                          alt={`Logo ${c.nom}`}
                          className="w-12 h-12 rounded-sm object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center border border-border">
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h2 className="font-display italic text-xl leading-tight text-primary group-hover:text-accent transition-colors">{c.nom}</h2>
                        {c.secteur && (
                          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            {c.secteur}
                          </span>
                        )}
                      </div>
                    </div>

                    {c.description && (
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                        {c.description}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border/50 pt-4 mt-4 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      {c.localisation && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {c.localisation}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                        <Briefcase className="h-3 w-3" /> {activeOffersCount} offre(s) active(s)
                      </span>
                    </div>
                    
                    <Link
                      to="/entreprises/$companyId"
                      params={{ companyId: c.id }}
                      className="text-xs font-mono uppercase tracking-widest text-primary hover:underline font-semibold"
                    >
                      Voir la fiche →
                    </Link>
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
