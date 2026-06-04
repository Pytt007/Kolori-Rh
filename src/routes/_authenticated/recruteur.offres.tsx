import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getMyCompany, OFFER_STATUS_LABELS } from "@/lib/recruiter";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";
import { Plus, Briefcase, Eye, PauseCircle, PlayCircle, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recruteur/offres")({
  component: RecruteurOffres,
});

type Offer = {
  id: string;
  titre: string;
  contrat: string;
  localisation: string | null;
  statut: string;
  created_at: string;
  publiee_le: string | null;
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; badge: string }> = {
  publiee: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  brouillon: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
  },
  suspendue: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
  },
  expiree: {
    bg: "bg-red-50/50",
    text: "text-red-500",
    dot: "bg-red-400",
    badge: "bg-red-100 text-red-600",
  },
};

function RecruteurOffres() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Offer[]>([]);
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [offerIdToDelete, setOfferIdToDelete] = useState<string | null>(null);
  const [offerTitleToDelete, setOfferTitleToDelete] = useState<string>("");

  async function load() {
    if (!user) return;
    try {
      const company = await getMyCompany(user.id);
      if (!company) {
        setLoading(false);
        return;
      }
      setCompanyId(company.id);
      setCompanyStatus(company.statut);

      if (user.id.startsWith("mock-")) {
        const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
        const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
        setRows(mockOffers);
        const mockApps = getMockApplications();
        const c: Record<string, number> = {};
        mockApps.forEach((a) => {
          c[a.offer_id] = (c[a.offer_id] ?? 0) + 1;
        });
        setCounts(c);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("job_offers")
        .select("id, titre, contrat, localisation, statut, created_at, publiee_le")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const offers = (data ?? []) as Offer[];
      setRows(offers);
      if (offers.length) {
        const { data: apps, error: appsErr } = await supabase
          .from("applications")
          .select("offer_id")
          .in(
            "offer_id",
            offers.map((o) => o.id),
          );
        if (appsErr) throw appsErr;
        const c: Record<string, number> = {};
        (apps ?? []).forEach((a) => {
          c[a.offer_id] = (c[a.offer_id] ?? 0) + 1;
        });
        setCounts(c);
      }
    } catch (e: any) {
      console.warn("Supabase query failed, falling back to mock data:", e);
      const company = await getMyCompany(user.id);
      if (company) {
        const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
        const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
        setRows(mockOffers);
        const mockApps = getMockApplications();
        const c: Record<string, number> = {};
        mockApps.forEach((a) => {
          c[a.offer_id] = (c[a.offer_id] ?? 0) + 1;
        });
        setCounts(c);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [user]);

  async function changeStatus(id: string, newStatus: "publiee" | "suspendue" | "brouillon") {
    if (user?.id.startsWith("mock-")) {
      const { getMockJobOffers, saveMockJobOffer } = await import("@/lib/mockData");
      const mockOffers = getMockJobOffers();
      const offer = mockOffers.find((o) => o.id === id);
      if (offer) {
        offer.statut = newStatus;
        if (newStatus === "publiee") offer.publiee_le = new Date().toISOString();
        saveMockJobOffer(offer);
        toast.success("Offre mise à jour (simulation).");
        load();
      }
      return;
    }
    const payload: { statut: typeof newStatus; publiee_le?: string } = { statut: newStatus };
    if (newStatus === "publiee") payload.publiee_le = new Date().toISOString();
    const { error } = await supabase.from("job_offers").update(payload).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Offre mise à jour.");
    load();
  }

  async function executeRemove(id: string) {
    if (user?.id.startsWith("mock-")) {
      const { getMockJobOffers } = await import("@/lib/mockData");
      const mockOffers = getMockJobOffers();
      const list = mockOffers.filter((o) => o.id !== id);
      localStorage.setItem("mock_job_offers", JSON.stringify(list));
      toast.success("Offre supprimée (simulation).");
      load();
      return;
    }
    const { error } = await supabase.from("job_offers").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Offre supprimée.");
    load();
  }

  if (loading)
    return (
      <div className="dash-empty">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Chargement…</p>
      </div>
    );

  if (!companyId) {
    return (
      <>
        <div className="page-hero page-hero-recruteur animate-reveal">
          <div className="hero-content">
            <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
              Diffusion
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Mes offres</h1>
          </div>
        </div>
        <div className="dash-empty">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mb-2">
            🏢
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">
            Créez d'abord votre fiche entreprise
          </h3>
          <p className="text-sm text-muted-foreground">
            Vous devez renseigner la fiche de votre entreprise avant de publier des offres.
          </p>
          <Link
            to="/recruteur/entreprise"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all mt-2"
          >
            Créer ma fiche →
          </Link>
        </div>
      </>
    );
  }

  const canPublish = companyStatus === "validee";
  const publishedCount = rows.filter((o) => o.statut === "publiee").length;
  const draftCount = rows.filter((o) => o.statut === "brouillon").length;

  return (
    <>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-recruteur animate-reveal">
        <div
          className="page-hero-blob"
          style={{ width: 300, height: 300, background: "#059669", top: -120, right: -80 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 180, height: 180, background: "#34D399", bottom: -60, left: 40 }}
        />
        <div className="hero-content flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
              Diffusion
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">
              Mes offres
            </h1>
            <div className="flex flex-wrap gap-2">
              <span
                className="stat-pill"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              >
                📋 {rows.length} offre{rows.length !== 1 ? "s" : ""}
              </span>
              {publishedCount > 0 && (
                <span
                  className="stat-pill"
                  style={{
                    background: "rgba(16,185,129,0.3)",
                    borderColor: "rgba(16,185,129,0.5)",
                    color: "#6EE7B7",
                  }}
                >
                  ✓ {publishedCount} publiée{publishedCount !== 1 ? "s" : ""}
                </span>
              )}
              {draftCount > 0 && (
                <span
                  className="stat-pill"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  ✎ {draftCount} brouillon{draftCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          {canPublish && (
            <Link
              to="/recruteur/offres/nouvelle"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" /> Nouvelle offre
            </Link>
          )}
        </div>
      </div>

      {!canPublish && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-800">Entreprise en attente de validation</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Votre entreprise doit être validée par notre équipe avant que vous puissiez créer ou
              publier des offres.
            </p>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="dash-empty">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center text-4xl mb-2">
            💼
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">
            Aucune offre pour l'instant
          </h3>
          <p className="text-sm text-muted-foreground">
            Publiez votre première offre pour commencer à recevoir des candidatures.
          </p>
          {canPublish && (
            <Link
              to="/recruteur/offres/nouvelle"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all mt-2"
            >
              <Plus className="h-4 w-4" /> Créer ma première offre
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          {/* Column headers */}
          <div
            className="hidden sm:grid px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-border/60"
            style={{ gridTemplateColumns: "1fr auto auto auto" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Titre / Localisation
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">
              Candidatures
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">
              Statut
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-4">
              Actions
            </span>
          </div>

          <div className="divide-y divide-border/50">
            {rows.map((o) => {
              const s = OFFER_STATUS_LABELS[o.statut] ?? { label: o.statut, tone: "bg-muted" };
              const sc = STATUS_CONFIG[o.statut] ?? {
                bg: "",
                text: "",
                dot: "bg-gray-400",
                badge: "bg-muted text-muted-foreground",
              };
              const appCount = counts[o.id] ?? 0;

              return (
                <div
                  key={o.id}
                  className="relative flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => navigate({ to: "/recruteur/offres/$offerId", params: { offerId: o.id } })}
                >
                  {/* Status dot + title */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${sc.dot}`} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors block truncate">
                        {o.titre}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold uppercase">
                          {o.contrat}
                        </span>
                        {o.localisation && <span>{o.localisation}</span>}
                        <span className="text-muted-foreground/50">·</span>
                        <span className="font-mono text-[10px]">
                          {new Date(o.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Application count */}
                  <div className="hidden sm:flex items-center justify-center shrink-0 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${appCount > 0 ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500"}`}
                    >
                      👥 {appCount}
                    </span>
                  </div>

                  {/* Status badge */}
                  <span className={`badge-modern shrink-0 px-4 ${sc.badge}`}>{s.label}</span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {o.statut !== "publiee" && canPublish && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        title="Publier"
                        onClick={(e) => {
                          e.stopPropagation();
                          changeStatus(o.id, "publiee");
                        }}
                      >
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {o.statut === "publiee" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Suspendre"
                        onClick={(e) => {
                          e.stopPropagation();
                          changeStatus(o.id, "suspendue");
                        }}
                      >
                        <PauseCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Éditer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({ to: "/recruteur/offres/$offerId", params: { offerId: o.id } });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Supprimer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOfferIdToDelete(o.id);
                        setOfferTitleToDelete(o.titre);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
          setOfferIdToDelete(null);
          setOfferTitleToDelete("");
        }}
        onConfirm={() => {
          if (offerIdToDelete) {
            executeRemove(offerIdToDelete);
          }
        }}
        title="Supprimer l'offre"
        description={`Êtes-vous sûr de vouloir supprimer définitivement l'offre "${offerTitleToDelete}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </>
  );
}
