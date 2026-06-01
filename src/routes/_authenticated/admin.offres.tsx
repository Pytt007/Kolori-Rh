import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Briefcase, Search, Filter, Ban, Check, Calendar, Trash2 } from "lucide-react";
import { OFFER_STATUS_LABELS } from "@/lib/recruiter";

export const Route = createFileRoute("/_authenticated/admin/offres")({
  component: AdminOffres,
});

type OfferRow = {
  id: string;
  titre: string;
  description: string;
  contrat: string;
  localisation: string | null;
  teletravail: string | null;
  statut: "brouillon" | "publiee" | "suspendue" | "expiree";
  created_at: string;
  company: { nom: string } | null;
};

function AdminOffres() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function loadOffers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_offers")
        .select(`
          id,
          titre,
          description,
          contrat,
          localisation,
          teletravail,
          statut,
          created_at,
          company:companies(nom)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers((data as any ?? []) as OfferRow[]);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les offres.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffers();
  }, []);

  async function handleStatusChange(id: string, newStatus: "publiee" | "suspendue" | "expiree") {
    try {
      const { error } = await supabase
        .from("job_offers")
        .update({ statut: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Statut mis à jour : ${OFFER_STATUS_LABELS[newStatus]?.label}.`);
      loadOffers();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de modifier le statut de l'offre.");
    }
  }

  async function handleDeleteOffer(id: string, title: string) {
    if (!confirm(`Supprimer définitivement l'offre "${title}" ? Cette action est irréversible.`)) return;

    try {
      const { error } = await supabase
        .from("job_offers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Offre d'emploi supprimée.");
      loadOffers();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer l'offre.");
    }
  }

  const filteredOffers = offers.filter((o) => {
    const matchesSearch = o.titre.toLowerCase().includes(filterQuery.toLowerCase()) || 
                          (o.company?.nom ?? "").toLowerCase().includes(filterQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement des offres…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
        Modération
      </div>
      <h1 className="font-display italic text-5xl mb-10">Modération des Offres.</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex items-center px-3 border border-border bg-card rounded-sm w-full sm:w-64 h-9">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <Input
              className="border-0 shadow-none focus-visible:ring-0 text-sm h-full"
              placeholder="Rechercher titre, entreprise…"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          <select
            className="bg-card border border-border rounded-sm px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-9"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous statuts</option>
            <option value="brouillon">Brouillons</option>
            <option value="publiee">Publiées</option>
            <option value="suspendue">Suspendues</option>
            <option value="expiree">Expirées</option>
          </select>
        </div>
      </div>

      {filteredOffers.length === 0 ? (
        <Card className="text-center py-20 border border-dashed border-border bg-card">
          <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-display italic text-2xl">Aucune offre d'emploi trouvée.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Les offres créées par les recruteurs apparaîtront ici.
          </p>
        </Card>
      ) : (
        <div className="border border-border rounded-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-border font-mono text-xs uppercase tracking-widest text-muted-foreground bg-secondary/20">
                  <th className="py-4 px-6">Offre / Entreprise</th>
                  <th className="py-4 px-6">Contrat / Ville</th>
                  <th className="py-4 px-6">Date de création</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredOffers.map((o) => {
                  const s = OFFER_STATUS_LABELS[o.statut] ?? { label: o.statut, tone: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={o.id} className="hover:bg-secondary/5">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-base">{o.titre}</div>
                          <div className="text-xs text-primary font-mono font-semibold uppercase tracking-wider">
                            {o.company?.nom ?? "Sans entreprise"}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-semibold">{o.contrat}</span>
                          <span className="text-xs text-muted-foreground">{o.localisation ?? "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm font-semibold ${s.tone}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right flex justify-end gap-1">
                        {o.statut === "publiee" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded-sm font-mono text-xs uppercase"
                            onClick={() => handleStatusChange(o.id, "suspendue")}
                            title="Suspendre l'offre"
                          >
                            <Ban className="h-4 w-4 mr-1" /> Suspendre
                          </Button>
                        )}

                        {o.statut === "suspendue" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-sm font-mono text-xs uppercase"
                            onClick={() => handleStatusChange(o.id, "publiee")}
                            title="Réactiver l'offre"
                          >
                            <Check className="h-4 w-4 mr-1" /> Publier
                          </Button>
                        )}

                        {o.statut !== "expiree" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-muted-foreground hover:bg-secondary rounded-sm font-mono text-xs uppercase"
                            onClick={() => handleStatusChange(o.id, "expiree")}
                            title="Expirer l'offre"
                          >
                            <Calendar className="h-4 w-4 mr-1" /> Expirer
                          </Button>
                        )}

                        {o.statut === "expiree" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-sm font-mono text-xs uppercase"
                            onClick={() => handleStatusChange(o.id, "publiee")}
                            title="Réactiver l'offre"
                          >
                            <Check className="h-4 w-4 mr-1" /> Publier
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-destructive hover:bg-destructive/10 rounded-sm font-mono text-xs uppercase"
                          onClick={() => handleDeleteOffer(o.id, o.titre)}
                          title="Supprimer l'offre"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
