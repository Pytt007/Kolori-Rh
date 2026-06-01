import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Building2, Check, X, Globe, MapPin, Search } from "lucide-react";
import { displayName, fetchProfilesByIds, type ProfileLite } from "@/lib/recruiter";

export const Route = createFileRoute("/_authenticated/admin/entreprises")({
  component: AdminEntreprises,
});

type CompanyRow = {
  id: string;
  nom: string;
  logo_url: string | null;
  secteur: string | null;
  localisation: string | null;
  description: string | null;
  site_web: string | null;
  statut: "en_attente" | "validee" | "rejetee";
  owner_id: string;
  created_at: string;
};

function AdminEntreprises() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("en_attente");
  const [filterQuery, setFilterQuery] = useState("");

  async function loadCompanies() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (data as any ?? []) as CompanyRow[];
      setCompanies(list);

      // Récupérer les profils des propriétaires (recruteurs)
      const ownerIds = list.map((c) => c.owner_id);
      setProfiles(await fetchProfilesByIds(ownerIds));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les entreprises.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  async function updateStatus(id: string, newStatus: "validee" | "rejetee") {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ statut: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(newStatus === "validee" ? "Entreprise approuvée." : "Entreprise rejetée.");
      loadCompanies();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de modifier le statut de l'entreprise.");
    }
  }

  const filteredCompanies = companies.filter((c) => {
    const matchesTab = c.statut === activeTab;
    const matchesSearch = c.nom.toLowerCase().includes(filterQuery.toLowerCase()) || 
                          (c.secteur ?? "").toLowerCase().includes(filterQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement des entreprises…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
        Modération
      </div>
      <h1 className="font-display italic text-5xl mb-10">Validation des Entreprises.</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Tabs defaultValue="en_attente" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-muted p-1 rounded-sm">
            <TabsTrigger value="en_attente" className="text-xs font-mono uppercase tracking-wider rounded-sm">
              En attente ({companies.filter(c => c.statut === "en_attente").length})
            </TabsTrigger>
            <TabsTrigger value="validee" className="text-xs font-mono uppercase tracking-wider rounded-sm">
              Validées ({companies.filter(c => c.statut === "validee").length})
            </TabsTrigger>
            <TabsTrigger value="rejetee" className="text-xs font-mono uppercase tracking-wider rounded-sm">
              Rejetées ({companies.filter(c => c.statut === "rejetee").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center px-3 border border-border bg-card rounded-sm w-full sm:w-80 h-9">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-full"
            placeholder="Rechercher par nom, secteur…"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <Card className="text-center py-20 border border-dashed border-border bg-card">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-display italic text-2xl">Aucune entreprise dans cette catégorie.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Les demandes de modération ou d'inscriptions s'afficheront ici.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredCompanies.map((c) => {
            const recruiterName = displayName(profiles[c.owner_id], "Recruteur inconnu");
            return (
              <Card key={c.id} className="p-6 bg-card border border-border rounded-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        alt={`Logo ${c.nom}`}
                        className="w-16 h-16 rounded-sm object-cover border border-border bg-white"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-sm bg-secondary flex items-center justify-center border border-border">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h2 className="font-display italic text-2xl">{c.nom}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
                        {c.secteur && <span>{c.secteur}</span>}
                        {c.secteur && c.localisation && <span>·</span>}
                        {c.localisation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {c.localisation}
                          </span>
                        )}
                        <span>·</span>
                        <span className="text-primary font-semibold">Propriétaire : {recruiterName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {c.site_web && (
                      <a
                        href={c.site_web.startsWith("http") ? c.site_web : `https://${c.site_web}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-2"
                      >
                        <Button size="sm" variant="ghost" className="h-9 gap-1 font-mono uppercase tracking-widest text-xs">
                          <Globe className="h-4 w-4" /> Site
                        </Button>
                      </a>
                    )}

                    {c.statut === "en_attente" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-9 gap-1 font-mono uppercase tracking-widest text-xs font-semibold"
                          onClick={() => updateStatus(c.id, "validee")}
                        >
                          <Check className="h-4 w-4" /> Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/20 text-destructive hover:bg-destructive/10 rounded-sm h-9 gap-1 font-mono uppercase tracking-widest text-xs font-semibold"
                          onClick={() => updateStatus(c.id, "rejetee")}
                        >
                          <X className="h-4 w-4" /> Rejeter
                        </Button>
                      </>
                    )}

                    {c.statut === "validee" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/20 text-destructive hover:bg-destructive/10 rounded-sm h-9 gap-1 font-mono uppercase tracking-widest text-xs font-semibold"
                        onClick={() => updateStatus(c.id, "rejetee")}
                      >
                        <X className="h-4 w-4" /> Révoquer
                      </Button>
                    )}

                    {c.statut === "rejetee" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-9 gap-1 font-mono uppercase tracking-widest text-xs font-semibold"
                        onClick={() => updateStatus(c.id, "validee")}
                      >
                        <Check className="h-4 w-4" /> Réhabiliter
                      </Button>
                    )}
                  </div>
                </div>

                {c.description && (
                  <div className="mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {c.description}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
