import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMockApplications, getMockJobOffers, getMockCompanies } from "@/lib/mockData";
import { useAuth } from "@/lib/auth-context";
import { APPLICATION_STATUS_LABELS, ensureCandidate } from "@/lib/candidate";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";

export const Route = createFileRoute("/_authenticated/candidat/candidatures")({
  component: CandidatCandidatures,
});

type Row = {
  id: string;
  statut: string;
  created_at: string;
  lettre: string | null;
  offer: {
    id: string;
    titre: string;
    contrat: string;
    localisation: string | null;
    company: { nom: string } | null;
  } | null;
};

function CandidatCandidatures() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [appIdToRetire, setAppIdToRetire] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const cid = await ensureCandidate(user.id);
    const { data } = await supabase
      .from("applications")
      .select(
        "id, statut, created_at, lettre, offer:job_offers(id, titre, contrat, localisation, company:companies(nom))",
      )
      .eq("candidate_id", cid)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setRows((data as unknown as Row[]) ?? []);
    } else {
      // Fallback local storage
      const mockApps = getMockApplications().filter((a) => a.candidate_id === cid);
      const mapped = mockApps.map((a) => {
        const off = getMockJobOffers().find((o) => o.id === a.offer_id);
        const comp = off ? getMockCompanies().find((c) => c.id === off.company_id) : null;
        return {
          id: a.id,
          statut: a.statut,
          created_at: a.created_at,
          lettre: a.lettre,
          offer: off
            ? {
                id: off.id,
                titre: off.titre,
                contrat: off.contrat,
                localisation: off.localisation,
                company: comp ? { nom: comp.nom } : null,
              }
            : null,
        };
      });
      setRows(mapped as any);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [user]);

  async function executeRetirer(id: string) {
    try {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
      toast.success("Candidature retirée.");
      load();
    } catch (err) {
      console.warn("Database delete failed, falling back to local simulation:", err);
      const stored = localStorage.getItem("mock_applications");
      if (stored) {
        const list = JSON.parse(stored).filter((a: any) => a.id !== id);
        localStorage.setItem("mock_applications", JSON.stringify(list));
      }
      toast.success("Candidature retirée (Mode Démo).");
      load();
    }
  }

  const statusCounts = rows.reduce(
    (acc, r) => {
      acc[r.statut] = (acc[r.statut] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-candidat animate-reveal">
        <div
          className="page-hero-blob"
          style={{ width: 320, height: 320, background: "#2A5298", top: -120, right: -80 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 200, height: 200, background: "#60A5FA", bottom: -80, left: 60 }}
        />
        <div className="hero-content">
          <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
            Suivi
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
            Mes candidatures
          </h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className="stat-pill"
              style={{
                background: "rgba(255,255,255,0.15)",
                borderColor: "rgba(255,255,255,0.2)",
                color: "white",
              }}
            >
              📋 {rows.length} candidature{rows.length !== 1 ? "s" : ""}
            </span>
            {(statusCounts["entretien"] ?? 0) > 0 && (
              <span
                className="stat-pill"
                style={{
                  background: "rgba(16,185,129,0.25)",
                  borderColor: "rgba(16,185,129,0.4)",
                  color: "#6EE7B7",
                }}
              >
                🎯 {statusCounts["entretien"]} entretien{statusCounts["entretien"] !== 1 ? "s" : ""}
              </span>
            )}
            {(statusCounts["retenu"] ?? 0) > 0 && (
              <span
                className="stat-pill"
                style={{
                  background: "rgba(251,191,36,0.25)",
                  borderColor: "rgba(251,191,36,0.4)",
                  color: "#FDE68A",
                }}
              >
                🏆 {statusCounts["retenu"]} retenu{statusCounts["retenu"] !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="dash-empty">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Chargement…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="dash-empty">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mb-2">
            📭
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">
            Aucune candidature pour l'instant
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Commencez à postuler aux offres qui correspondent à votre profil.
          </p>
          <Link
            to="/offres"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all mt-2"
          >
            Parcourir les offres →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-border/60">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Poste
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Statut
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Date
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Action
            </span>
          </div>

          <div className="divide-y divide-border/50">
            {rows.map((r) => {
              const s = APPLICATION_STATUS_LABELS[r.statut] ?? {
                label: r.statut,
                tone: "bg-muted text-muted-foreground",
              };
              const closed = r.statut === "rejete" || r.statut === "retenu";
              const isRetenu = r.statut === "retenu";
              const statusEmoji =
                r.statut === "entretien"
                  ? "🗓"
                  : r.statut === "retenu"
                    ? "🏆"
                    : r.statut === "rejete"
                      ? "✗"
                      : r.statut === "preselectionne"
                        ? "⭐"
                        : "📄";

              return (
                <div
                  key={r.id}
                  className={`flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-4 sm:p-5 transition-colors ${isRetenu ? "bg-emerald-50/50" : "hover:bg-slate-50/70"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base ${isRetenu ? "bg-emerald-100" : r.statut === "rejete" ? "bg-red-50" : r.statut === "entretien" ? "bg-blue-50" : "bg-primary/8"}`}
                  >
                    {statusEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    {r.offer ? (
                      <Link
                        to="/offres/$offerId"
                        params={{ offerId: r.offer.id }}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {r.offer.titre}
                      </Link>
                    ) : (
                      <span className="font-bold text-sm text-muted-foreground">
                        Offre supprimée
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                      {r.offer?.company?.nom && (
                        <span className="font-semibold">{r.offer.company.nom}</span>
                      )}
                      {r.offer?.company?.nom && r.offer?.localisation && <span>·</span>}
                      {r.offer?.localisation && <span>{r.offer.localisation}</span>}
                      {r.offer?.contrat && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold uppercase">
                          {r.offer.contrat}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge-modern shrink-0 ${s.tone}`}>{s.label}</span>
                  <span className="text-[11px] text-muted-foreground font-mono shrink-0 hidden sm:block">
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <div className="shrink-0">
                    {!closed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg font-semibold"
                        onClick={() => {
                          setAppIdToRetire(r.id);
                          setConfirmOpen(true);
                        }}
                      >
                        Retirer
                      </Button>
                    ) : isRetenu ? (
                      <span className="text-[11px] font-bold text-emerald-600">
                        🎉 Félicitations !
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground/60 italic">
                        Clôturée
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setAppIdToRetire(null);
        }}
        onConfirm={() => {
          if (appIdToRetire) {
            executeRetirer(appIdToRetire);
          }
        }}
        title="Retirer la candidature"
        description="Êtes-vous sûr de vouloir retirer cette candidature ? Cette action est définitive."
        confirmText="Retirer"
        cancelText="Annuler"
        variant="destructive"
      />
    </>
  );
}
