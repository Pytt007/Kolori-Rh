import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { displayName, fetchProfilesByIds, type ProfileLite } from "@/lib/recruiter";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, User, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recruteur/favoris")({
  component: RecruteurFavoris,
});

type Candidate = {
  id: string;
  user_id: string;
  titre: string | null;
  ville: string | null;
  bio: string | null;
  diplome: string | null;
  competences: string[] | null;
  pretention_salariale: string | null;
  disponibilite: string | null;
};

type FavoriteRow = {
  id: string;
  candidate_id: string;
  candidate: Candidate | null;
};

function RecruteurFavoris() {
  const { user } = useAuth();
  const [rows, setRows] = useState<FavoriteRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Candidate | null>(null);

  async function loadData() {
    if (!user) return;
    try {
      setLoading(true);

      if (user.id.startsWith("mock-")) {
        // Return a pre-loaded mock favorite for demo mode
        const mockFavs: FavoriteRow[] = [
          {
            id: "fav-1",
            candidate_id: "mock-candidate-1",
            candidate: {
              id: "mock-candidate-1",
              user_id: "mock-candidate-1",
              titre: "Directeur des Ressources Humaines",
              ville: "Abidjan",
              bio: "Professionnel RH avec 8 ans d'expérience en gestion des talents, droit social et administration du personnel en Côte d'Ivoire.",
              diplome:
                "Master en Management des Ressources Humaines — Université Félix Houphouët-Boigny",
              competences: [
                "Recrutement",
                "Droit social",
                "SYSCOHADA",
                "Leadership",
                "Gestion des conflits",
              ],
              pretention_salariale: "1 500 000 – 2 000 000 FCFA",
              disponibilite: "Immédiate",
            },
          },
        ];
        setRows(mockFavs);
        setProfiles({
          "mock-candidate-1": {
            id: "mock-candidate-1",
            prenom: "Koffi",
            nom: "Anan",
            telephone: "+225 07 08 09 10 11",
          },
        });
        setLoading(false);
        return;
      }

      // Récupérer les favoris avec les détails du candidat lié
      const { data, error } = await supabase
        .from("favorites")
        .select(
          `
          id,
          candidate_id,
          candidate:candidates(
            id,
            user_id,
            titre,
            ville,
            bio,
            diplome,
            competences,
            pretention_salariale,
            disponibilite
          )
        `,
        )
        .eq("recruiter_id", user.id);

      if (error) throw error;

      const favRows = ((data as any) ?? []) as FavoriteRow[];
      setRows(favRows);

      // Récupérer les profils utilisateurs
      const userIds = favRows.map((r) => r.candidate?.user_id).filter(Boolean) as string[];

      setProfiles(await fetchProfilesByIds(userIds));
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement de vos favoris.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  const removeFavorite = async (candidateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) return;

    // Handle mock mode
    if (user.id.startsWith("mock-")) {
      setRows((prev) => prev.filter((r) => r.candidate_id !== candidateId));
      if (active?.id === candidateId) setActive(null);
      toast.success("Candidat retiré des favoris.");
      return;
    }

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("recruiter_id", user.id)
        .eq("candidate_id", candidateId);

      if (error) throw error;

      setRows((prev) => prev.filter((r) => r.candidate_id !== candidateId));
      toast.success("Candidat retiré des favoris.");

      // Si le candidat actuellement ouvert en modal a été retiré, fermer la modal
      if (active?.id === candidateId) {
        setActive(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de retirer le candidat des favoris.");
    }
  };

  if (loading)
    return <div className="text-sm font-mono text-muted-foreground">Chargement des favoris…</div>;

  return (
    <>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-recruteur animate-reveal mb-8">
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
            Candidats favoris
          </h1>
          <p className="text-white/70 text-xs mt-1">
            Retrouvez ici les profils de candidats que vous avez marqués comme favoris.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-sm bg-card">
          <Star className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-display italic text-2xl mb-2">Aucun favori pour le moment.</p>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Marquez des candidats d'une étoile dans la CVthèque pour les regrouper ici.
          </p>
          <Link
            to="/recruteur/cvtheque"
            className="text-sm font-mono uppercase tracking-widest text-primary hover:underline font-semibold"
          >
            Explorer la CVthèque →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((r) => {
            const c = r.candidate;
            if (!c) return null;

            const name = displayName(profiles[c.user_id]);
            return (
              <div
                key={r.id}
                className="relative group bg-card border border-border rounded-sm hover:border-primary transition-colors cursor-pointer"
                onClick={() => setActive(c)}
              >
                <div className="p-6 pr-12">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    {c.ville ?? "—"}
                  </div>
                  <div className="font-display italic text-2xl mb-1">{name}</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {c.titre ?? "Profil sans titre"}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(c.competences ?? []).slice(0, 6).map((s) => (
                      <span key={s} className="text-xs px-2 py-1 bg-secondary rounded-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => removeFavorite(c.id, e)}
                  className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-secondary text-accent transition-all"
                  title="Retirer des favoris"
                >
                  <Star className="h-5 w-5 fill-accent text-accent" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader className="relative pr-12">
                <DialogTitle className="font-display italic text-3xl">
                  {displayName(profiles[active.user_id])}
                </DialogTitle>
                <button
                  type="button"
                  onClick={(e) => removeFavorite(active.id, e)}
                  className="absolute right-8 top-1 p-1.5 rounded-full hover:bg-secondary text-accent transition-all"
                  title="Retirer des favoris"
                >
                  <Star className="h-5 w-5 fill-accent text-accent" />
                </button>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {active.titre ?? "—"} {active.ville ? `· ${active.ville}` : ""}
                </div>
                {active.bio && <p className="whitespace-pre-line leading-relaxed">{active.bio}</p>}
                {active.diplome && (
                  <div>
                    <span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                      Diplôme :{" "}
                    </span>
                    {active.diplome}
                  </div>
                )}
                {active.disponibilite && (
                  <div>
                    <span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                      Disponibilité :{" "}
                    </span>
                    {active.disponibilite}
                  </div>
                )}
                {active.pretention_salariale && (
                  <div>
                    <span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                      Prétention :{" "}
                    </span>
                    {active.pretention_salariale}
                  </div>
                )}
                {active.competences && active.competences.length > 0 && (
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                      Compétences
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {active.competences.map((s) => (
                        <span key={s} className="text-xs px-2 py-1 bg-secondary rounded-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground border-t border-border pt-4">
                  Pour échanger avec ce candidat, attendez qu'il postule à l'une de vos offres ou
                  diffusez de nouvelles annonces ciblées.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
