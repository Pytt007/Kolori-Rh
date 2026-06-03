import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { displayName, fetchProfilesByIds, getMyCompany, type ProfileLite } from "@/lib/recruiter";
import { APPLICATION_STATUS_LABELS } from "@/lib/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/recruteur/candidatures")({
  component: RecruteurCandidatures,
});

type App = {
  id: string;
  statut: string;
  created_at: string;
  lettre: string | null;
  notes_recruteur: string | null;
  cv_id: string | null;
  offer: { id: string; titre: string } | null;
  candidate: {
    id: string;
    user_id: string;
    titre: string | null;
    ville: string | null;
    bio: string | null;
    competences: string[] | null;
  } | null;
};

type MessageType = {
  id: string;
  sender_id: string;
  recipient_id: string;
  application_id: string | null;
  contenu: string;
  lu: boolean;
  created_at: string;
};

const STATUSES = [
  "envoyee",
  "recue",
  "en_analyse",
  "preselectionne",
  "entretien",
  "retenu",
  "rejete",
] as const;

function RecruteurCandidatures() {
  const { user } = useAuth();
  const [rows, setRows] = useState<App[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOffer, setFilterOffer] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<App | null>(null);
  const [notes, setNotes] = useState("");

  async function load() {
    if (!user) return;
    try {
      const company = await getMyCompany(user.id);
      if (!company) {
        setLoading(false);
        return;
      }

      if (user.id === "mock-recruiter-1") {
        const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
        const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
        const ids = mockOffers.map((o) => o.id);
        if (!ids.length) {
          setRows([]);
          setLoading(false);
          return;
        }

        const mockApps = getMockApplications().filter((a) => ids.includes(a.offer_id));
        const r: App[] = mockApps.map((a) => {
          const offer = mockOffers.find((o) => o.id === a.offer_id);
          return {
            id: a.id,
            statut: a.statut,
            created_at: a.created_at,
            lettre: a.lettre,
            notes_recruteur: (a as any).notes_recruteur ?? null,
            cv_id: a.cv_id,
            offer: offer ? { id: offer.id, titre: offer.titre } : null,
            candidate: {
              id: a.candidate_id,
              user_id: a.candidate_id,
              titre: "Directeur des Ressources Humaines",
              ville: "Abidjan",
              bio: "Candidat qualifié avec 8 ans d'expérience.",
              competences: ["Recrutement", "Droit social", "SYSCOHADA"],
            },
          };
        });
        setRows(r);
        const userIds = r.map((x) => x.candidate?.user_id).filter(Boolean) as string[];
        setProfiles(await fetchProfilesByIds(userIds));
        setLoading(false);
        return;
      }

      const { data: offers } = await supabase
        .from("job_offers")
        .select("id")
        .eq("company_id", company.id);
      const ids = (offers ?? []).map((o) => o.id);
      if (!ids.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("applications")
        .select(
          "id, statut, created_at, lettre, notes_recruteur, cv_id, offer:job_offers(id, titre), candidate:candidates(id, user_id, titre, ville, bio, competences)",
        )
        .in("offer_id", ids)
        .order("created_at", { ascending: false });
      const r = (data as unknown as App[]) ?? [];
      setRows(r);
      const userIds = r.map((x) => x.candidate?.user_id).filter(Boolean) as string[];
      setProfiles(await fetchProfilesByIds(userIds));
    } catch (e: any) {
      console.warn("Failed loading applications from Supabase, falling back:", e);
      const company = await getMyCompany(user.id);
      if (company) {
        const { getMockJobOffers, getMockApplications } = await import("@/lib/mockData");
        const mockOffers = getMockJobOffers().filter((o) => o.company_id === company.id);
        const ids = mockOffers.map((o) => o.id);
        if (ids.length) {
          const mockApps = getMockApplications().filter((a) => ids.includes(a.offer_id));
          const r: App[] = mockApps.map((a) => {
            const offer = mockOffers.find((o) => o.id === a.offer_id);
            return {
              id: a.id,
              statut: a.statut,
              created_at: a.created_at,
              lettre: a.lettre,
              notes_recruteur: (a as any).notes_recruteur ?? null,
              cv_id: a.cv_id,
              offer: offer ? { id: offer.id, titre: offer.titre } : null,
              candidate: {
                id: a.candidate_id,
                user_id: a.candidate_id,
                titre: "Directeur des Ressources Humaines",
                ville: "Abidjan",
                bio: "Candidat qualifié avec 8 ans d'expérience.",
                competences: ["Recrutement", "Droit social"],
              },
            };
          });
          setRows(r);
          const userIds = r.map((x) => x.candidate?.user_id).filter(Boolean) as string[];
          setProfiles(await fetchProfilesByIds(userIds));
        }
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [user]);

  const offers = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => r.offer && m.set(r.offer.id, r.offer.titre));
    return Array.from(m.entries());
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (filterStatus !== "all" && r.statut !== filterStatus) return false;
    if (filterOffer !== "all" && r.offer?.id !== filterOffer) return false;
    if (query) {
      const p = r.candidate ? profiles[r.candidate.user_id] : null;
      const name = `${p?.prenom ?? ""} ${p?.nom ?? ""} ${r.candidate?.titre ?? ""}`.toLowerCase();
      if (!name.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  async function setStatus(id: string, st: string) {
    if (user?.id === "mock-recruiter-1") {
      const { getMockApplications, saveMockApplication } = await import("@/lib/mockData");
      const apps = getMockApplications();
      const match = apps.find((a) => a.id === id);
      if (match) {
        match.statut = st;
        saveMockApplication(match);
        toast.success("Statut mis à jour (simulation).");
        load();
        if (active?.id === id) setActive({ ...active, statut: st });
      }
      return;
    }
    const { error } = await supabase
      .from("applications")
      .update({ statut: st as never })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Statut mis à jour.");
    load();
    if (active?.id === id) setActive({ ...active, statut: st });
  }

  async function openCV(cvId: string | null) {
    if (!cvId) {
      toast.info("Aucun CV joint.");
      return;
    }
    if (user?.id === "mock-recruiter-1" || cvId.startsWith("cv-")) {
      toast.success(
        `Téléchargement simulé pour le CV : ${cvId === "cv-1" ? "CV_Koffi_Anan_Directeur_RH.pdf" : "CV_Koffi_Anan_Consultant_Senior.pdf"}`,
      );
      return;
    }
    const { data: cv } = await supabase
      .from("cv_documents")
      .select("storage_path")
      .eq("id", cvId)
      .maybeSingle();
    if (!cv) {
      toast.error("CV introuvable.");
      return;
    }
    const { data, error } = await supabase.storage
      .from("cvs")
      .createSignedUrl(cv.storage_path, 300);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function saveNotes() {
    if (!active) return;
    if (user?.id === "mock-recruiter-1") {
      const { getMockApplications, saveMockApplication } = await import("@/lib/mockData");
      const apps = getMockApplications();
      const match = apps.find((a) => a.id === active.id);
      if (match) {
        (match as any).notes_recruteur = notes;
        saveMockApplication(match);
        toast.success("Notes enregistrées (simulation).");
        setActive({ ...active, notes_recruteur: notes });
      }
      return;
    }
    const { error } = await supabase
      .from("applications")
      .update({ notes_recruteur: notes })
      .eq("id", active.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notes enregistrées.");
    setActive({ ...active, notes_recruteur: notes });
  }

  function open(a: App) {
    setActive(a);
    setNotes(a.notes_recruteur ?? "");
  }

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement…</div>;

  return (
    <>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-recruteur animate-reveal">
        <div
          className="page-hero-blob"
          style={{ width: 280, height: 280, background: "#059669", top: -100, right: -80 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 160, height: 160, background: "#34D399", bottom: -60, left: 40 }}
        />
        <div className="hero-content">
          <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
            Sélection
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">
            Candidatures reçues
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
              👥 {rows.length} candidature{rows.length !== 1 ? "s" : ""}
            </span>
            {filtered.length !== rows.length && (
              <span
                className="stat-pill"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                🔍 {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} filtrés
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm p-4 mb-5">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              🔍
            </span>
            <Input
              placeholder="Rechercher un candidat…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 rounded-xl"
            />
          </div>
          <Select value={filterOffer} onValueChange={setFilterOffer}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Toutes les offres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les offres</SelectItem>
              {offers.map(([id, titre]) => (
                <SelectItem key={id} value={id}>
                  {titre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {APPLICATION_STATUS_LABELS[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="dash-empty">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center text-4xl mb-2">
            👥
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">
            Aucune candidature ne correspond
          </h3>
          <p className="text-sm text-muted-foreground">
            Modifiez vos filtres ou attendez de nouvelles candidatures.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          {/* Column header */}
          <div
            className="hidden sm:grid px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-border/60"
            style={{ gridTemplateColumns: "1fr auto auto" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Candidat / Poste
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">
              Date
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-4">
              Statut
            </span>
          </div>
          <div className="divide-y divide-border/50">
            {filtered.map((a) => {
              const st = APPLICATION_STATUS_LABELS[a.statut] ?? {
                label: a.statut,
                tone: "bg-muted",
              };
              const name = displayName(a.candidate ? profiles[a.candidate.user_id] : null);
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <button
                  key={a.id}
                  onClick={() => open(a)}
                  className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-emerald-50/30 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 text-white text-xs font-black shadow-sm">
                    {initials || "?"}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-bold text-sm text-foreground">{name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                      {a.candidate?.titre && <span>{a.candidate.titre}</span>}
                      {a.candidate?.titre && a.candidate?.ville && <span>·</span>}
                      {a.candidate?.ville && <span>{a.candidate.ville}</span>}
                      {a.offer?.titre && (
                        <span className="text-primary font-semibold">· {a.offer.titre}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono shrink-0 hidden sm:block px-4">
                    {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <span className={`badge-modern shrink-0 ${st.tone}`}>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {active &&
            (() => {
              const p = active.candidate ? profiles[active.candidate.user_id] : null;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="font-display italic text-3xl">
                      {displayName(p)}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-5 text-sm">
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      {active.candidate?.titre ?? "—"}{" "}
                      {active.candidate?.ville ? `· ${active.candidate.ville}` : ""}
                    </div>
                    {p?.telephone && (
                      <div>
                        <span className="text-muted-foreground">Téléphone : </span>
                        {p.telephone}
                      </div>
                    )}
                    {active.candidate?.bio && (
                      <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
                          À propos
                        </div>
                        <p>{active.candidate.bio}</p>
                      </div>
                    )}
                    {active.candidate?.competences && active.candidate.competences.length > 0 && (
                      <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                          Compétences
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {active.candidate.competences.map((c) => (
                            <span key={c} className="text-xs px-2 py-1 bg-secondary rounded-sm">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {active.lettre && (
                      <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
                          Lettre de motivation
                        </div>
                        <p className="whitespace-pre-wrap">{active.lettre}</p>
                      </div>
                    )}

                    <div className="border-t border-border pt-4">
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                        Statut
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {STATUSES.map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={active.statut === s ? "default" : "outline"}
                            onClick={() => setStatus(active.id, s)}
                          >
                            {APPLICATION_STATUS_LABELS[s].label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                        Notes internes
                      </div>
                      <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
                      <Button size="sm" className="mt-2" onClick={saveNotes}>
                        Enregistrer les notes
                      </Button>
                    </div>

                    <div className="flex gap-2 border-t border-border pt-4">
                      <Button variant="outline" onClick={() => openCV(active.cv_id)}>
                        Voir le CV
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
