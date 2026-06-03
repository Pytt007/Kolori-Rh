import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, List, Grid } from "lucide-react";
import { getMockReferentials, addMockReferential, deleteMockReferential } from "@/lib/mockData";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";

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
  const { user } = useAuth();
  const isMock = user?.id === "mock-admin-1";

  const [items, setItems] = useState<ReferentialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>("secteur");
  const [newValeur, setNewValeur] = useState("");
  const [newOrdre, setNewOrdre] = useState("0");
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; valeur: string } | null>(null);

  async function loadReferentials() {
    if (!user) return;
    // ── Mock mode ──────────────────────────────
    if (isMock) {
      setItems(getMockReferentials() as any);
      setLoading(false);
      return;
    }
    // ── Supabase ───────────────────────────────
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
  }, [user]);

  const filteredItems = items.filter((item) => item.type === activeType);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newValeur.trim()) return;
    if (isMock) {
      addMockReferential({
        type: activeType as any,
        valeur: newValeur.trim(),
        ordre: parseInt(newOrdre, 10) || 0,
        actif: true,
      });
      toast.success("Option ajoutée au référentiel.");
      setNewValeur("");
      setNewOrdre("0");
      loadReferentials();
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("referentials").insert({
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
    setItemToDelete({ id, valeur: value });
    setConfirmOpen(true);
  }

  async function executeDelete(id: string) {
    if (isMock) {
      deleteMockReferential(id);
      toast.success("Option supprimée.");
      loadReferentials();
      return;
    }
    try {
      const { error } = await supabase.from("referentials").delete().eq("id", id);

      if (error) throw error;

      toast.success("Option supprimée.");
      loadReferentials();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer cette option.");
    }
  }

  if (loading)
    return (
      <div className="dash-empty">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Chargement des référentiels…</p>
      </div>
    );

  const typeConfig: Record<
    string,
    { icon: string; label: string; color: string; activeColor: string }
  > = {
    secteur: {
      icon: "🏢",
      label: "Secteurs d'activité",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      activeColor: "bg-blue-600 text-white border-blue-600",
    },
    localisation: {
      icon: "📍",
      label: "Localisations",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      activeColor: "bg-emerald-600 text-white border-emerald-600",
    },
    contrat: {
      icon: "📄",
      label: "Types de contrat",
      color: "bg-purple-100 text-purple-800 border-purple-200",
      activeColor: "bg-purple-600 text-white border-purple-600",
    },
  };

  return (
    <>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-admin animate-reveal">
        <div
          className="page-hero-blob"
          style={{ width: 280, height: 280, background: "#9c1c1e", top: -100, right: -70 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 160, height: 160, background: "#1c305c", bottom: -60, left: 40 }}
        />
        <div className="hero-content">
          <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
            Configuration
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">
            Gestion des Référentiels
          </h1>
          <p className="text-white/60 text-sm">
            Gérez les listes déroulantes utilisées dans le formulaire des offres
          </p>
        </div>
      </div>

      {/* ── Type pills ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-6">
        {Object.entries(typeConfig).map(([key, conf]) => (
          <button
            key={key}
            onClick={() => setActiveType(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeType === key ? conf.activeColor : conf.color + " hover:brightness-95"}`}
          >
            <span>{conf.icon}</span>
            {conf.label}
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${activeType === key ? "bg-white/25" : "bg-white/70"}`}
            >
              {items.filter((i) => i.type === key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-6">
        {/* Add form */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div
            className={`px-5 py-3.5 border-b border-border/60 flex items-center gap-2 ${activeType === "secteur" ? "bg-gradient-to-r from-blue-50 to-white" : activeType === "localisation" ? "bg-gradient-to-r from-emerald-50 to-white" : "bg-gradient-to-r from-purple-50 to-white"}`}
          >
            <span className="text-lg">{typeConfig[activeType]?.icon}</span>
            <h2 className="font-display font-bold text-base text-foreground">Ajouter une option</h2>
          </div>
          <form onSubmit={handleAdd} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
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
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Ordre d'affichage
              </label>
              <Input
                type="number"
                min="0"
                value={newOrdre}
                onChange={(e) => setNewOrdre(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Les valeurs sont triées par ordre croissant.
              </p>
            </div>

            <Button type="submit" className="w-full rounded-xl gap-2" disabled={busy}>
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </form>
        </div>

        {/* Options list */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display font-bold text-base text-foreground">
                {typeConfig[activeType]?.label}{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  ({filteredItems.length})
                </span>
              </h2>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-content py-12 text-center px-6">
              <span className="text-4xl mb-3">📦</span>
              <p className="text-sm font-medium text-muted-foreground">
                Aucune option enregistrée pour ce type.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Ajoutez des options via le formulaire à gauche.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                      {item.ordre}
                    </span>
                    <span className="text-sm font-medium text-foreground">{item.valeur}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(item.id, item.valeur)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={() => {
          if (itemToDelete) {
            executeDelete(itemToDelete.id);
          }
        }}
        title="Supprimer l'option"
        description={`Êtes-vous sûr de vouloir supprimer "${itemToDelete?.valeur}" de la liste ? Note : Cela peut impacter les offres existantes liées.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </>
  );
}
