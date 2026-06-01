import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, List, Grid } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/referentiels")({
  component: AdminReferentiels,
});

type ReferentialRow = {
  id: string;
  type: string;
  valeur: string;
  ordre: number;
  actif: boolean;
};

function AdminReferentiels() {
  const [items, setItems] = useState<ReferentialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>("secteur");
  const [newValeur, setNewValeur] = useState("");
  const [newOrdre, setNewOrdre] = useState("0");
  const [busy, setBusy] = useState(false);

  async function loadReferentials() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("referentials")
        .select("*")
        .order("ordre", { ascending: true })
        .order("valeur", { ascending: true });

      if (error) throw error;
      setItems((data as ReferentialRow[]) ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les référentiels.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReferentials();
  }, []);

  const filteredItems = items.filter((item) => item.type === activeType);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newValeur.trim()) return;

    setBusy(true);
    try {
      const { error } = await supabase
        .from("referentials")
        .insert({
          type: activeType,
          valeur: newValeur.trim(),
          ordre: parseInt(newOrdre, 10) || 0,
          actif: true,
        });

      if (error) throw error;

      toast.success("Option ajoutée au référentiel.");
      setNewValeur("");
      setNewOrdre("0");
      loadReferentials();
    } catch (err: any) {
      console.error(err);
      if (err.code === "23505") {
        toast.error("Cette valeur existe déjà pour ce référentiel.");
      } else {
        toast.error("Impossible d'ajouter cette option.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string, value: string) {
    if (!confirm(`Supprimer "${value}" de la liste ?\nNote : Cela peut impacter les offres existantes liées.`)) return;

    try {
      const { error } = await supabase
        .from("referentials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Option supprimée.");
      loadReferentials();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer cette option.");
    }
  }

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement des référentiels…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
        Configuration
      </div>
      <h1 className="font-display italic text-5xl mb-10">Gestion des Référentiels.</h1>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <Tabs defaultValue="secteur" value={activeType} onValueChange={setActiveType} className="w-full">
          <TabsList className="bg-muted p-1 rounded-sm mb-6">
            <TabsTrigger value="secteur" className="text-xs font-mono uppercase tracking-wider rounded-sm">
              Secteurs d'activité
            </TabsTrigger>
            <TabsTrigger value="localisation" className="text-xs font-mono uppercase tracking-wider rounded-sm">
              Localisations / Villes
            </TabsTrigger>
            <TabsTrigger value="contrat" className="text-xs font-mono uppercase tracking-wider rounded-sm">
              Types de contrat
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-8">
        {/* Ajouter une option */}
        <div>
          <Card className="p-6 bg-card border border-border rounded-sm">
            <h2 className="font-display italic text-xl mb-4">Ajouter une option</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-2">
                  Nom / Valeur
                </label>
                <Input
                  required
                  placeholder={
                    activeType === "secteur" 
                      ? "ex: Finance & Comptabilité" 
                      : activeType === "localisation" 
                        ? "ex: Abidjan" 
                        : "ex: CDI"
                  }
                  value={newValeur}
                  onChange={(e) => setNewValeur(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-2">
                  Ordre d'affichage
                </label>
                <Input
                  type="number"
                  min="0"
                  value={newOrdre}
                  onChange={(e) => setNewOrdre(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Les valeurs sont triées par ordre croissant.
                </p>
              </div>

              <Button type="submit" className="w-full rounded-sm gap-2" disabled={busy}>
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </form>
          </Card>
        </div>

        {/* Liste des options */}
        <div>
          <Card className="p-6 bg-card border border-border rounded-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
              <List className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display italic text-xl">
                Liste des options (Type : {activeType})
              </h2>
            </div>

            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6">Aucune option enregistrée.</p>
            ) : (
              <div className="border border-border rounded-sm divide-y divide-border/60">
                {filteredItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-secondary/5">
                    <div>
                      <div className="font-medium text-sm">{item.valeur}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Ordre : {item.ordre}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive hover:bg-destructive/10 rounded-sm"
                      onClick={() => handleDelete(item.id, item.valeur)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
