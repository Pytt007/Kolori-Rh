import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { displayName, fetchProfilesByIds, type ProfileLite } from "@/lib/recruiter";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recruteur/cvtheque")({
  component: CVtheque,
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

function CVtheque() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Candidate[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [favorites, setFavorites] = useState<string[]>([]); // candidate_ids favoris
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [ville, setVille] = useState("");
  const [active, setActive] = useState<Candidate | null>(null);

  async function loadData() {
    if (!user) return;
    try {
      if (user.id === "mock-recruiter-1") {
        // Mock candidates for demo mode
        const mockCandidates: Candidate[] = [
          {
            id: "mock-candidate-1",
            user_id: "mock-candidate-1",
            titre: "Directeur des Ressources Humaines",
            ville: "Abidjan",
            bio: "Professionnel RH avec 8 ans d'expérience en gestion des talents, droit social et administration du personnel en Côte d'Ivoire. Passionné par l'accompagnement des équipes et la transformation organisationnelle.",
            diplome: "Master en Management des Ressources Humaines — Université Félix Houphouët-Boigny",
            competences: ["Recrutement", "Droit social", "SYSCOHADA", "Leadership", "Gestion des conflits", "Formation"],
            pretention_salariale: "1 500 000 – 2 000 000 FCFA",
            disponibilite: "Immédiate"
          },
          {
            id: "mock-candidate-2",
            user_id: "mock-candidate-2",
            titre: "Développeur Full-Stack React / Node.js",
            ville: "Abidjan",
            bio: "Développeur passionné avec 5 ans d'expérience dans la création d'applications web modernes. Maîtrise des architectures microservices et des pratiques DevOps.",
            diplome: "Licence en Informatique — Institut National Polytechnique Félix Houphouët-Boigny",
            competences: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS"],
            pretention_salariale: "800 000 – 1 200 000 FCFA",
            disponibilite: "1 mois de préavis"
          },
          {
            id: "mock-candidate-3",
            user_id: "mock-candidate-3",
            titre: "Responsable Comptable",
            ville: "Bouaké",
            bio: "Expert comptable certifié spécialisé en comptabilité générale et fiscalité ivoirienne. Expérience en cabinet et en entreprise industrielle.",
            diplome: "BTS Comptabilité et Gestion — Institut Supérieur de Commerce d'Abidjan",
            competences: ["Comptabilité générale", "SYSCOHADA", "Déclarations fiscales", "Paie", "Excel"],
            pretention_salariale: "600 000 – 900 000 FCFA",
            disponibilite: "2 semaines"
          }
        ];
        setRows(mockCandidates);
        setProfiles({
          "mock-candidate-1": { id: "mock-candidate-1", prenom: "Koffi", nom: "Anan", telephone: "+225 07 08 09 10 11" },
          "mock-candidate-2": { id: "mock-candidate-2", prenom: "Serge", nom: "Kouassi", telephone: "+225 05 06 07 08 09" },
          "mock-candidate-3": { id: "mock-candidate-3", prenom: "Aminata", nom: "Diallo", telephone: "+225 01 02 03 04 05" }
        });
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Charger les candidats
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("id, user_id, titre, ville, bio, diplome, competences, pretention_salariale, disponibilite")
        .order("updated_at", { ascending: false })
        .limit(200);
      const list = (candidatesData ?? []) as Candidate[];

      if (list.length === 0) {
        // Fallback mock data if supabase returns nothing
        const mockCandidates: Candidate[] = [
          {
            id: "mock-candidate-1",
            user_id: "mock-candidate-1",
            titre: "Directeur des Ressources Humaines",
            ville: "Abidjan",
            bio: "Professionnel RH avec 8 ans d'expérience en gestion des talents et droit social en Côte d'Ivoire.",
            diplome: "Master en Management des Ressources Humaines",
            competences: ["Recrutement", "Droit social", "SYSCOHADA", "Leadership"],
            pretention_salariale: "1 500 000 – 2 000 000 FCFA",
            disponibilite: "Immédiate"
          }
        ];
        setRows(mockCandidates);
        setProfiles({
          "mock-candidate-1": { id: "mock-candidate-1", prenom: "Koffi", nom: "Anan", telephone: "+225 07 08 09 10 11" }
        });
      } else {
        setRows(list);
        setProfiles(await fetchProfilesByIds(list.map((c) => c.user_id)));
      }

      // Charger les favoris du recruteur
      const { data: favsData } = await supabase
        .from("favorites")
        .select("candidate_id")
        .eq("recruiter_id", user.id);
      
      setFavorites((favsData ?? []).map((f) => f.candidate_id));
    } catch (err) {
      console.error(err);
      // Fallback mock data on error
      const mockCandidates: Candidate[] = [
        {
          id: "mock-candidate-1",
          user_id: "mock-candidate-1",
          titre: "Directeur des Ressources Humaines",
          ville: "Abidjan",
          bio: "Professionnel RH avec 8 ans d'expérience en gestion des talents et droit social en Côte d'Ivoire.",
          diplome: "Master en Management des Ressources Humaines",
          competences: ["Recrutement", "Droit social", "SYSCOHADA", "Leadership"],
          pretention_salariale: "1 500 000 – 2 000 000 FCFA",
          disponibilite: "Immédiate"
        }
      ];
      setRows(mockCandidates);
      setProfiles({
        "mock-candidate-1": { id: "mock-candidate-1", prenom: "Koffi", nom: "Anan", telephone: "+225 07 08 09 10 11" }
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  const toggleFavorite = async (candidateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) return;

    const isFav = favorites.includes(candidateId);

    // Handle mock mode - just update local state
    if (user.id === "mock-recruiter-1") {
      if (isFav) {
        setFavorites(favorites.filter((id) => id !== candidateId));
        toast.success("Candidat retiré des favoris.");
      } else {
        setFavorites([...favorites, candidateId]);
        toast.success("Candidat ajouté aux favoris.");
      }
      return;
    }

    if (isFav) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("recruiter_id", user.id)
        .eq("candidate_id", candidateId);
      
      if (error) {
        toast.error("Impossible de retirer le candidat des favoris.");
      } else {
        setFavorites(favorites.filter((id) => id !== candidateId));
        toast.success("Candidat retiré des favoris.");
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ recruiter_id: user.id, candidate_id: candidateId });

      if (error) {
        toast.error("Impossible d'ajouter le candidat aux favoris.");
      } else {
        setFavorites([...favorites, candidateId]);
        toast.success("Candidat ajouté aux favoris.");
      }
    }
  };

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      if (ville && !(c.ville ?? "").toLowerCase().includes(ville.toLowerCase())) return false;
      if (q) {
        const p = profiles[c.user_id];
        const blob = `${c.titre ?? ""} ${c.bio ?? ""} ${(c.competences ?? []).join(" ")} ${p?.prenom ?? ""} ${p?.nom ?? ""}`.toLowerCase();
        if (!blob.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, profiles, q, ville]);

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Recherche</div>
      <h1 className="font-display italic text-5xl mb-10">CVthèque.</h1>

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <Input placeholder="Mots-clés (titre, compétence, nom…)" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input placeholder="Ville" value={ville} onChange={(e) => setVille(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-sm">
          <p className="font-display italic text-2xl">Aucun profil ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const name = displayName(profiles[c.user_id]);
            const isFav = favorites.includes(c.id);
            return (
              <div 
                key={c.id} 
                className="relative group bg-card border border-border rounded-sm hover:border-primary transition-colors cursor-pointer"
                onClick={() => setActive(c)}
              >
                <div className="p-6 pr-12">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{c.ville ?? "—"}</div>
                  <div className="font-display italic text-2xl mb-1">{name}</div>
                  <div className="text-sm text-muted-foreground mb-3">{c.titre ?? "Profil sans titre"}</div>
                  <div className="flex flex-wrap gap-1">
                    {(c.competences ?? []).slice(0, 6).map((s) => (
                      <span key={s} className="text-xs px-2 py-1 bg-secondary rounded-sm">{s}</span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(c.id, e)}
                  className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-accent transition-all"
                  title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Star className={`h-5 w-5 ${isFav ? "fill-accent text-accent" : "text-muted-foreground"}`} />
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
                  onClick={(e) => toggleFavorite(active.id, e)}
                  className="absolute right-8 top-1 p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-accent transition-all"
                  title={favorites.includes(active.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Star className={`h-5 w-5 ${favorites.includes(active.id) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </button>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {active.titre ?? "—"} {active.ville ? `· ${active.ville}` : ""}
                </div>
                {active.bio && <p className="whitespace-pre-line leading-relaxed">{active.bio}</p>}
                {active.diplome && <div><span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Diplôme : </span>{active.diplome}</div>}
                {active.disponibilite && <div><span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Disponibilité : </span>{active.disponibilite}</div>}
                {active.pretention_salariale && <div><span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Prétention : </span>{active.pretention_salariale}</div>}
                {active.competences && active.competences.length > 0 && (
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Compétences</div>
                    <div className="flex flex-wrap gap-2">
                      {active.competences.map((s) => <span key={s} className="text-xs px-2 py-1 bg-secondary rounded-sm">{s}</span>)}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground border-t border-border pt-4">
                  Pour échanger avec ce candidat, attendez qu'il postule à l'une de vos offres ou diffusez de nouvelles annonces ciblées.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
