import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  OFFER_STATUS_LABELS,
  displayName,
  fetchProfilesByIds,
  type ProfileLite,
} from "@/lib/recruiter";
import { APPLICATION_STATUS_LABELS } from "@/lib/candidate";
import { OfferForm, serializeOffer } from "@/components/site/OfferForm";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";
import { AIDashboardDialog } from "@/components/site/AIDashboardDialog";
import { Brain } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recruteur/offres/$offerId")({
  component: EditOffre,
});

type Offer = {
  id: string;
  titre: string;
  description: string;
  contrat: string;
  secteur: string | null;
  localisation: string | null;
  teletravail: string | null;
  salaire_min: number | null;
  salaire_max: number | null;
  competences_requises: string[] | null;
  statut: string;
  departement: string | null;
  missions_principales: string | null;
  responsabilites: string | null;
  objectifs: string | null;
  niveau_etudes_min: string | null;
  experience_min: number | null;
  competences_souhaitees: string[] | null;
  certifications_souhaitees: string[] | null;
  langues_souhaitees: string[] | null;
  date_limite: string | null;
  salaire_texte: string | null;
  avantages: string | null;
  horaires: string | null;
  criteres_ia: any | null;
};

type App = {
  id: string;
  statut: string;
  created_at: string;
  candidate: { id: string; user_id: string; titre: string | null; ville: string | null } | null;
};

function EditOffre() {
  const { offerId } = Route.useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [isMockUser, setIsMockUser] = useState(false);

  async function load() {
    const mockUserStr =
      typeof window !== "undefined" ? localStorage.getItem("mock_auth_user") : null;
    const isMock = mockUserStr ? JSON.parse(mockUserStr).id.startsWith("mock-") : false;
    setIsMockUser(isMock);

    if (isMock) {
      const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
      const offers = getMockJobOffers();
      const match = offers.find((o) => o.id === offerId);
      if (match) {
        setOffer({
          ...match,
          competences_requises: match.competences_requises
            ? typeof match.competences_requises === "string"
              ? match.competences_requises.split(",").map((c) => c.trim())
              : match.competences_requises
            : null,
          teletravail: match.teletravail ? "oui" : "non",
        } as any);
        const allApps = getMockApplications();
        const matchApps = allApps.filter((a) => a.offer_id === offerId);
        const formattedApps: App[] = matchApps.map((a) => ({
          id: a.id,
          statut: a.statut,
          created_at: a.created_at,
          candidate: {
            id: a.candidate_id,
            user_id: a.candidate_id,
            titre: "Directeur des Ressources Humaines",
            ville: "Abidjan",
          },
        }));
        setApps(formattedApps);
        setProfiles({
          "mock-candidate-1": {
            id: "mock-candidate-1",
            prenom: "Koffi",
            nom: "Anan",
            telephone: "+225 07 08 09 10 11",
          },
        });
      }
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("job_offers")
        .select("*")
        .eq("id", offerId)
        .maybeSingle();
      setOffer(data as Offer | null);
      const { data: a } = await supabase
        .from("applications")
        .select("id, statut, created_at, candidate:candidates(id, user_id, titre, ville)")
        .eq("offer_id", offerId)
        .order("created_at", { ascending: false });
      const list = (a as unknown as App[]) ?? [];
      setApps(list);
      setProfiles(
        await fetchProfilesByIds(list.map((x) => x.candidate?.user_id).filter(Boolean) as string[]),
      );
    } catch (e) {
      console.warn("Failed to load offer from Supabase, trying mock fallback:", e);
      const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
      const offers = getMockJobOffers();
      const match = offers.find((o) => o.id === offerId);
      if (match) {
        setOffer({
          ...match,
          competences_requises: match.competences_requises
            ? typeof match.competences_requises === "string"
              ? match.competences_requises.split(",").map((c) => c.trim())
              : match.competences_requises
            : null,
          teletravail: match.teletravail ? "oui" : "non",
        } as any);
        const allApps = getMockApplications();
        const matchApps = allApps.filter((a) => a.offer_id === offerId);
        const formattedApps: App[] = matchApps.map((a) => ({
          id: a.id,
          statut: a.statut,
          created_at: a.created_at,
          candidate: {
            id: a.candidate_id,
            user_id: a.candidate_id,
            titre: "Directeur des Ressources Humaines",
            ville: "Abidjan",
          },
        }));
        setApps(formattedApps);
        setProfiles({
          "mock-candidate-1": {
            id: "mock-candidate-1",
            prenom: "Koffi",
            nom: "Anan",
            telephone: "+225 07 08 09 10 11",
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }
  const [confirmOpen, setConfirmOpen] = useState(false);
  useEffect(() => {
    load();
  }, [offerId]);

  async function executeDeleteOffer() {
    const mockUserStr =
      typeof window !== "undefined" ? localStorage.getItem("mock_auth_user") : null;
    const isMock = mockUserStr ? JSON.parse(mockUserStr).id.startsWith("mock-") : false;
    if (isMock) {
      const { getMockJobOffers } = await import("@/lib/mockData");
      const list = getMockJobOffers().filter((o) => o.id !== offerId);
      localStorage.setItem("mock_job_offers", JSON.stringify(list));
      toast.success("Offre supprimée (simulation).");
      navigate({ to: "/recruteur/offres" });
      return;
    }
    const { error } = await supabase.from("job_offers").delete().eq("id", offerId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Offre supprimée.");
    navigate({ to: "/recruteur/offres" });
  }

  if (loading) return (
    <div className="dash-empty">
      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="text-sm text-muted-foreground font-medium">Chargement…</p>
    </div>
  );

  if (!offer) return (
    <div className="dash-empty">
      <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center text-4xl mb-2">❌</div>
      <h3 className="font-display font-bold text-xl">Offre introuvable</h3>
      <p className="text-sm text-muted-foreground">Cette offre n'existe pas ou a été supprimée.</p>
      <Link to="/recruteur/offres" className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">
        ← Retour aux offres
      </Link>
    </div>
  );

  const s = OFFER_STATUS_LABELS[offer.statut];

  return (
    <>
      {/* HERO BANNER */}
      <div className="page-hero page-hero-recruteur animate-reveal mb-8">
        <div className="hero-content">
          <Link
            to="/recruteur/offres"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/60 hover:text-white transition-colors mb-3"
          >
            ← Retour aux offres
          </Link>
          <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>Édition d'offre</div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight">{offer.titre}</h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${s?.tone ?? "bg-white/20 text-white"}`}>
              {s?.label ?? offer.statut}
            </span>
            <span className="text-xs text-white/50">{apps.length} candidature{apps.length !== 1 ? "s" : ""} reçue{apps.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="hero-actions">
          <Button
            variant="ghost"
            onClick={() => setConfirmOpen(true)}
            className="text-white/70 hover:text-red-300 hover:bg-red-500/10 border border-white/20 rounded-xl text-xs font-semibold"
          >
            🗑 Supprimer l'offre
          </Button>
        </div>
      </div>

      {/* Barre action IA — n'affecte pas le design existant */}
      <div className="flex items-center gap-3 mb-6 -mt-4">
        <button
          type="button"
          onClick={() => setAiDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border/60 shadow-sm text-sm font-bold text-[#059669] hover:bg-emerald-50 hover:border-emerald-200 transition-all"
        >
          <Brain className="h-4 w-4" />
          Analyse IA des candidats
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 ml-1">
            {apps.length} profil{apps.length !== 1 ? "s" : ""}
          </span>
        </button>
      </div>

      <OfferForm
        submitLabel="Enregistrer les modifications"
        initial={{
          titre: offer.titre,
          description: offer.description,
          contrat: offer.contrat as never,
          secteur: offer.secteur ?? "",
          localisation: offer.localisation ?? "",
          teletravail: offer.teletravail ?? "",
          salaire_min: offer.salaire_min?.toString() ?? "",
          salaire_max: offer.salaire_max?.toString() ?? "",
          competences_requises: (offer.competences_requises ?? []).join(", "),
          departement: offer.departement ?? "",
          missions_principales: offer.missions_principales ?? "",
          responsabilites: offer.responsabilites ?? "",
          objectifs: offer.objectifs ?? "",
          niveau_etudes_min: offer.niveau_etudes_min ?? "Aucun",
          experience_min: offer.experience_min?.toString() ?? "0",
          competences_souhaitees: (offer.competences_souhaitees ?? []).join(", "),
          certifications_souhaitees: (offer.certifications_souhaitees ?? []).join(", "),
          langues_souhaitees: (offer.langues_souhaitees ?? []).join(", "),
          date_limite: offer.date_limite ?? "",
          salaire_texte: offer.salaire_texte ?? "",
          avantages: offer.avantages ?? "",
          horaires: offer.horaires ?? "",
          ponderation_competences: offer.criteres_ia?.ponderation?.competences ?? 50,
          ponderation_experience: offer.criteres_ia?.ponderation?.experience ?? 25,
          ponderation_formation: offer.criteres_ia?.ponderation?.formation ?? 15,
          ponderation_langues: offer.criteres_ia?.ponderation?.langues ?? 5,
          ponderation_certifications: offer.criteres_ia?.ponderation?.certifications ?? 5,
        }}
        onSubmit={async (v) => {
          const mockUserStr =
            typeof window !== "undefined" ? localStorage.getItem("mock_auth_user") : null;
          const isMock = mockUserStr ? JSON.parse(mockUserStr).id.startsWith("mock-") : false;
          if (isMock) {
            const { getMockJobOffers, saveMockJobOffer } = await import("@/lib/mockData");
            const offers = getMockJobOffers();
            const match = offers.find((o) => o.id === offerId);
            if (match) {
              const updated = {
                ...match,
                ...serializeOffer(v),
              };
              saveMockJobOffer(updated as any);
              toast.success("Offre mise à jour (simulation).");
              load();
            }
            return;
          }
          const { error } = await supabase
            .from("job_offers")
            .update(serializeOffer(v))
            .eq("id", offerId);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Offre mise à jour.");
          load();
        }}
      />

      {/* Candidatures section */}
      {apps.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display font-bold text-2xl text-foreground mb-5 flex items-center gap-2">
            👥 Candidatures reçues
            <span className="text-sm font-mono font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">{apps.length}</span>
          </h2>
          <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden divide-y divide-border/50">
            {apps.map((a) => {
              const st = APPLICATION_STATUS_LABELS[a.statut] ?? {
                label: a.statut,
                tone: "bg-muted",
              };
              const name = displayName(a.candidate ? profiles[a.candidate.user_id] : null);
              return (
                <Link
                  key={a.id}
                  to="/recruteur/candidatures"
                  className="flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-slate-50/70 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {a.candidate?.titre ?? "Profil"}{" "}
                        {a.candidate?.ville ? `· ${a.candidate.ville}` : ""} ·{" "}
                        {new Date(a.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.tone}`}>
                    {st.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeDeleteOffer}
        title="Supprimer l'offre"
        description="Êtes-vous sûr de vouloir supprimer cette offre ? Cette action est définitive et irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* ── Assistant IA de présélection ──────────────────────── */}
      {offer && (
        <AIDashboardDialog
          open={aiDialogOpen}
          onClose={() => setAiDialogOpen(false)}
          isMockUser={isMockUser}
          offer={{
            id: offerId,
            titre: offer.titre,
            description: offer.description,
            secteur: offer.secteur,
            contrat: offer.contrat,
            localisation: offer.localisation,
            competences_requises: offer.competences_requises ?? [],
            competences_souhaitees: offer.competences_souhaitees ?? [],
            experience_min: offer.experience_min,
            niveau_etudes_min: offer.niveau_etudes_min,
            langues_souhaitees: offer.langues_souhaitees ?? [],
            criteres_ia: offer.criteres_ia,
          }}
          applicantsRaw={apps.map((a) => ({
            candidateId: a.candidate?.id ?? "",
            applicationId: a.id,
            cvId: null,
          }))}
        />
      )}
    </>
  );
}

