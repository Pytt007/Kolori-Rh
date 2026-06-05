import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Briefcase, Search, Filter, Ban, Check, Calendar, Trash2 } from "lucide-react";
import { OFFER_STATUS_LABELS } from "@/lib/recruiter";
import { getMockJobOffers, getMockAdminCompanies, saveMockJobOffer } from "@/lib/mockData";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";

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
  risk_score?: number;
};

function AdminOffres() {
  const { user } = useAuth();
  const isMock = user?.id.startsWith("mock-");

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<{ id: string; title: string } | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  async function loadOffers() {
    if (!user) return;
    // ── Mock mode ──────────────────────────────
    if (isMock) {
      const mockOffers = getMockJobOffers();
      const mockCompanies = getMockAdminCompanies();
      const enriched = mockOffers.map((o) => {
        let rScore = 12;
        if (o.description.length < 150) rScore += 35;
        if (o.titre.toLowerCase().includes("senior") || o.titre.toLowerCase().includes("react")) rScore += 45;
        if (o.titre.toLowerCase().includes("directeur")) rScore = 15;
        return {
          ...o,
          risk_score: rScore,
          company: { nom: mockCompanies.find((c) => c.id === o.company_id)?.nom ?? "Entreprise" },
        };
      }) as any as OfferRow[];
      setOffers(enriched);
      setLoading(false);
      return;
    }
    // ── Supabase ───────────────────────────────
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_offers")
        .select(
          `
          id,
          titre,
          description,
          contrat,
          localisation,
          teletravail,
          statut,
          created_at,
          company:companies(nom)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Load risk scores (fraud_alerts table not in generated types, cast to any)
      const { data: alerts } = await (supabase as any)
        .from("fraud_alerts")
        .select("ressource_id, score")
        .eq("type", "suspicious_offer");

      const alertsMap = ((alerts as any[]) ?? []).reduce((acc: Record<string, number>, curr: any) => {
        acc[curr.ressource_id] = curr.score;
        return acc;
      }, {} as Record<string, number>);

      const enriched = ((data as any) ?? []).map((o: any) => ({
        ...o,
        risk_score: alertsMap[o.id] ?? 0
      }));

      setOffers(enriched);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les offres.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffers();
  }, [user]);

  async function handleStatusChange(id: string, newStatus: "publiee" | "suspendue" | "expiree") {
    if (isMock) {
      const all = getMockJobOffers();
      const offer = all.find((o) => o.id === id);
      if (offer) {
        offer.statut = newStatus;
        saveMockJobOffer(offer);
      }
      toast.success(`Statut mis à jour : ${OFFER_STATUS_LABELS[newStatus]?.label}.`);
      loadOffers();
      return;
    }
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
    setOfferToDelete({ id, title });
    setConfirmOpen(true);
  }

  async function executeDeleteOffer(id: string) {
    if (isMock) {
      const all = getMockJobOffers().filter((o) => o.id !== id);
      localStorage.setItem("mock_job_offers", JSON.stringify(all));
      toast.success("Offre d'emploi supprimée.");
      loadOffers();
      return;
    }
    try {
      const { error } = await supabase.from("job_offers").delete().eq("id", id);

      if (error) throw error;

      toast.success("Offre d'emploi supprimée.");
      loadOffers();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer l'offre.");
    }
  }

  const filteredOffers = offers.filter((o) => {
    const matchesSearch =
      o.titre.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (o.company?.nom ?? "").toLowerCase().includes(filterQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.statut === statusFilter;

    let matchesRisk = true;
    const r = o.risk_score ?? 0;
    if (riskFilter === "high") matchesRisk = r >= 60;
    else if (riskFilter === "medium") matchesRisk = r >= 30 && r < 60;
    else if (riskFilter === "low") matchesRisk = r < 30;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  if (loading)
    return (
      <div className="dash-empty">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Chargement des offres…</p>
      </div>
    );

  const statusCounts = offers.reduce(
    (acc, o) => {
      acc[o.statut] = (acc[o.statut] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-admin animate-reveal">
        <div
          className="page-hero-blob"
          style={{ width: 320, height: 320, background: "#9c1c1e", top: -120, right: -80 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 180, height: 180, background: "#1c305c", bottom: -60, left: 40 }}
        />
        <div className="hero-content">
          <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
            Modération
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
            Modération des Offres
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span
              className="stat-pill"
              style={{
                background: "rgba(255,255,255,0.15)",
                borderColor: "rgba(255,255,255,0.2)",
                color: "white",
              }}
            >
              💼 {offers.length} offre{offers.length !== 1 ? "s" : ""}
            </span>
            {(statusCounts["publiee"] ?? 0) > 0 && (
              <span
                className="stat-pill"
                style={{
                  background: "rgba(16,185,129,0.25)",
                  borderColor: "rgba(16,185,129,0.4)",
                  color: "#6EE7B7",
                }}
              >
                ✓ {statusCounts["publiee"]} publiée{statusCounts["publiee"] !== 1 ? "s" : ""}
              </span>
            )}
            {(statusCounts["suspendue"] ?? 0) > 0 && (
              <span
                className="stat-pill"
                style={{
                  background: "rgba(251,191,36,0.25)",
                  borderColor: "rgba(251,191,36,0.4)",
                  color: "#FDE68A",
                }}
              >
                ⏸ {statusCounts["suspendue"]} suspendue{statusCounts["suspendue"] !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 rounded-xl"
              placeholder="Rechercher titre, entreprise…"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          <select
            className="bg-slate-50 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous statuts</option>
            <option value="brouillon">Brouillons</option>
            <option value="publiee">Publiées</option>
            <option value="suspendue">Suspendues</option>
            <option value="expiree">Expirées</option>
          </select>

          <select
            className="bg-slate-50 border border-border/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">Tous niveaux de risque</option>
            <option value="high">Risque élevé (≥ 60%)</option>
            <option value="medium">Risque modéré (30%-59%)</option>
            <option value="low">Risque faible (&lt; 30%)</option>
          </select>
        </div>
      </div>

      {filteredOffers.length === 0 ? (
        <div className="dash-empty">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mb-2">
            💼
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">Aucune offre trouvée</h3>
          <p className="text-sm text-muted-foreground">
            Les offres créées par les recruteurs apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Offre / Entreprise</th>
                  <th>Contrat / Ville</th>
                  <th>Date de création</th>
                  <th>Score de risque</th>
                  <th>Statut</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((o) => {
                  const s = OFFER_STATUS_LABELS[o.statut] ?? {
                    label: o.statut,
                    tone: "bg-muted text-muted-foreground",
                  };
                  const statusDot: Record<string, string> = {
                    publiee: "bg-emerald-500",
                    suspendue: "bg-amber-400",
                    brouillon: "bg-slate-400",
                    expiree: "bg-red-400",
                  };
                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${statusDot[o.statut] ?? "bg-gray-400"}`}
                          />
                          <div>
                            <div className="font-bold text-sm text-foreground">{o.titre}</div>
                            <div className="text-xs text-primary font-bold mt-0.5">
                              {o.company?.nom ?? "Sans entreprise"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase w-fit">
                            {o.contrat}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {o.localisation ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="text-xs font-mono text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td>
                        {o.risk_score !== undefined ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                            o.risk_score >= 60
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : o.risk_score >= 30
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            🛡️ {o.risk_score}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge-modern ${s.tone}`}>{s.label}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="flex justify-end gap-1">
                          {o.statut === "publiee" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                              onClick={() => handleStatusChange(o.id, "suspendue")}
                              title="Suspendre l'offre"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {o.statut === "suspendue" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              onClick={() => handleStatusChange(o.id, "publiee")}
                              title="Réactiver l'offre"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {o.statut !== "expiree" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-muted-foreground hover:bg-slate-100 rounded-lg"
                              onClick={() => handleStatusChange(o.id, "expiree")}
                              title="Expirer l'offre"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}
                          {o.statut === "expiree" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              onClick={() => handleStatusChange(o.id, "publiee")}
                              title="Réactiver l'offre"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-red-500 hover:bg-red-50 rounded-lg"
                            onClick={() => handleDeleteOffer(o.id, o.titre)}
                            title="Supprimer l'offre"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setOfferToDelete(null);
        }}
        onConfirm={() => {
          if (offerToDelete) {
            executeDeleteOffer(offerToDelete.id);
          }
        }}
        title="Supprimer l'offre"
        description={`Êtes-vous sûr de vouloir supprimer définitivement l'offre "${offerToDelete?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </>
  );
}
