import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_JOB_OFFERS, getMockJobOffers } from "@/lib/mockData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  lieu: z.string().optional().catch(""),
  contrat: z.string().optional().catch(""),
});

type OfferRow = {
  id: string;
  titre: string;
  description: string;
  contrat: string;
  localisation: string | null;
  teletravail: string | null;
  publiee_le: string | null;
  company_id: string;
};

export const Route = createFileRoute("/offres")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Offres d'emploi — Kolori RH" },
      {
        name: "description",
        content: "Parcourez les offres d'emploi publiées par les entreprises sur Kolori RH.",
      },
      { property: "og:title", content: "Offres d'emploi — Kolori RH" },
      {
        property: "og:description",
        content: "Parcourez toutes les offres publiées sur Kolori RH.",
      },
    ],
  }),
  component: OffresPage,
});

function OffresPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [lieu, setLieu] = useState(search.lieu ?? "");
  const [contrat, setContrat] = useState(search.contrat ?? "");
  const [offers, setOffers] = useState<OfferRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("job_offers")
        .select(
          "id, titre, description, contrat, localisation, teletravail, publiee_le, company_id",
        )
        .eq("statut", "publiee")
        .order("publiee_le", { ascending: false, nullsFirst: false })
        .limit(50);
      if (search.q) query = query.ilike("titre", `%${search.q}%`);
      if (search.lieu) query = query.ilike("localisation", `%${search.lieu}%`);
      if (search.contrat) query = query.eq("contrat", search.contrat as never);
      const { data, error } = await query;
      if (error) console.error(error);
      if (data && data.length > 0) {
        setOffers(data as OfferRow[]);
      } else {
        // Filter mock data locally
        let filtered = [...getMockJobOffers()];
        if (search.q) {
          const qLower = search.q.toLowerCase();
          filtered = filtered.filter(
            (o) =>
              o.titre.toLowerCase().includes(qLower) ||
              o.description.toLowerCase().includes(qLower),
          );
        }
        if (search.lieu) {
          const lieuLower = search.lieu.toLowerCase();
          filtered = filtered.filter((o) => o.localisation?.toLowerCase().includes(lieuLower));
        }
        if (search.contrat) {
          filtered = filtered.filter((o) => o.contrat === search.contrat);
        }
        setOffers(filtered as any);
      }
      setLoading(false);
    })();
  }, [search.q, search.lieu, search.contrat]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <SiteHeader />
      <main className="flex-1 pb-24">
        {/* Banner with clean Search fields */}
        <section className="bg-primary text-primary-foreground border-b border-border/10 py-20 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mb-32 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <span className="text-xs uppercase tracking-widest text-white/80 font-bold block mb-3">
              RECHERCHE
            </span>
            <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight text-white mb-8">
              Trouvez un emploi que vous allez adorer
            </h1>

            <form
              className="max-w-4xl mx-auto bg-white p-3 rounded-2xl md:rounded-full border border-border shadow-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-black"
              onSubmit={(e) => {
                e.preventDefault();
                const url = new URL(window.location.href);
                url.searchParams.set("q", q);
                url.searchParams.set("lieu", lieu);
                url.searchParams.set("contrat", contrat);
                window.history.pushState({}, "", url.toString());
                window.location.reload();
              }}
            >
              <div className="md:col-span-4 flex items-center px-4 py-2 border-b md:border-b-0 md:border-r border-border">
                <Search className="h-4.5 w-4.5 text-muted-foreground mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Poste, mots-clés…"
                  className="w-full bg-transparent text-sm focus:outline-none placeholder-muted-foreground"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="md:col-span-4 flex items-center px-4 py-2 border-b md:border-b-0 md:border-r border-border">
                <MapPin className="h-4.5 w-4.5 text-muted-foreground mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Ville ou Télétravail..."
                  className="w-full bg-transparent text-sm focus:outline-none placeholder-muted-foreground"
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 px-4 py-2 border-b md:border-b-0 md:border-r border-border flex items-center">
                <Select
                  value={contrat || "all"}
                  onValueChange={(val) => setContrat(val === "all" ? "" : val)}
                >
                  <SelectTrigger className="border-none shadow-none focus:ring-0 focus:ring-offset-0 bg-transparent text-sm font-semibold py-0.5 px-0 w-full cursor-pointer h-7 text-black flex items-center justify-between">
                    <SelectValue placeholder="Tous Contrats" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border rounded-xl shadow-lg">
                    <SelectItem
                      value="all"
                      className="cursor-pointer hover:bg-muted py-2 px-3 rounded-lg text-sm text-black"
                    >
                      Tous Contrats
                    </SelectItem>
                    <SelectItem
                      value="cdi"
                      className="cursor-pointer hover:bg-muted py-2 px-3 rounded-lg text-sm text-black"
                    >
                      CDI
                    </SelectItem>
                    <SelectItem
                      value="cdd"
                      className="cursor-pointer hover:bg-muted py-2 px-3 rounded-lg text-sm text-black"
                    >
                      CDD
                    </SelectItem>
                    <SelectItem
                      value="stage"
                      className="cursor-pointer hover:bg-muted py-2 px-3 rounded-lg text-sm text-black"
                    >
                      Stage
                    </SelectItem>
                    <SelectItem
                      value="alternance"
                      className="cursor-pointer hover:bg-muted py-2 px-3 rounded-lg text-sm text-black"
                    >
                      Alternance
                    </SelectItem>
                    <SelectItem
                      value="freelance"
                      className="cursor-pointer hover:bg-muted py-2 px-3 rounded-lg text-sm text-black"
                    >
                      Freelance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-full hover:brightness-110 shadow-md"
                >
                  Rechercher
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Job Offers list grid */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-border/60">
            <div className="font-semibold text-sm text-muted-foreground">
              {loading ? (
                "Recherche en cours..."
              ) : (
                <span>
                  <strong className="text-foreground">{offers?.length ?? 0}</strong> emploi(s)
                  trouvé(s) pour vous
                </span>
              )}
            </div>
          </div>

          {!loading && offers && offers.length === 0 && (
            <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-3xl">
              <p className="font-display font-bold text-2xl mb-2 text-foreground">
                Aucune offre ne correspond à vos critères.
              </p>
              <p className="text-muted-foreground text-sm">
                Modifiez vos mots-clés ou le lieu de recherche pour voir d'autres résultats.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers?.map((o) => {
              const pubDate = o.publiee_le ? new Date(o.publiee_le) : new Date();
              const day = pubDate.getDate();
              const month = pubDate
                .toLocaleDateString("fr-FR", { month: "short" })
                .replace(".", "");

              return (
                <Link
                  key={o.id}
                  to="/offres/$offerId"
                  params={{ offerId: o.id }}
                  className="bg-white border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/20 transition-all flex flex-col justify-between relative group"
                >
                  <div>
                    {/* Header: Date + Badge */}
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 bg-secondary text-secondary-foreground text-[10px] font-bold uppercase rounded-full tracking-wider border border-border/50">
                        {o.contrat}
                      </span>

                      {/* Floating Date Badge */}
                      <div className="flex flex-col items-center justify-center bg-primary/5 text-primary border border-primary/10 rounded-xl px-2.5 py-1.5 min-w-[45px] text-center shrink-0">
                        <span className="text-sm font-black leading-none">{day}</span>
                        <span className="text-[9px] uppercase font-bold leading-none mt-1">
                          {month}
                        </span>
                      </div>
                    </div>

                    <h2 className="font-display font-bold text-xl text-primary mb-3 leading-tight group-hover:text-accent transition-colors">
                      {o.titre}
                    </h2>

                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 mb-6">
                      {o.description}
                    </p>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
                    {o.localisation ? (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> {o.localisation}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs font-bold text-primary inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Postuler →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
