import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ensureCandidate } from "@/lib/candidate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/candidat/profil")({
  component: CandidatProfil,
});

function CandidatProfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    ville: "",
    photo_url: null as string | null,
  });
  const [candidate, setCandidate] = useState({
    id: "",
    titre: "",
    diplome: "",
    bio: "",
    disponibilite: "",
    pretention_salariale: "",
    competences: "",
  });

  async function uploadPhoto(file: File) {
    if (!user) return;
    if (user.id === "mock-candidate-1") {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setProfile((p) => ({ ...p, photo_url: result }));
        localStorage.setItem("mock_candidate_photo", result);
        window.dispatchEvent(new Event("profile-updated"));
        toast.success("Photo mise à jour (Mode Démo).");
      };
      reader.readAsDataURL(file);
      return;
    }
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("company_logos")
        .upload(`avatars/${path}`, file, { upsert: true });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("company_logos").getPublicUrl(`avatars/${path}`);
      setProfile((p) => ({ ...p, photo_url: data.publicUrl }));
      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Photo téléversée.");
    } catch (err: any) {
      toast.error(err.message || "Erreur de téléversement");
    }
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        if (user.id === "mock-candidate-1") {
          const savedPhoto = localStorage.getItem("mock_candidate_photo") || null;
          const savedPrenom = localStorage.getItem("mock_candidate_prenom") || "Koffi";
          const savedNom = localStorage.getItem("mock_candidate_nom") || "Anan";
          const savedTel =
            localStorage.getItem("mock_candidate_telephone") || "+225 07 08 09 10 11";
          const savedVille = localStorage.getItem("mock_candidate_ville") || "Abidjan";

          setProfile({
            prenom: savedPrenom,
            nom: savedNom,
            telephone: savedTel,
            ville: savedVille,
            photo_url: savedPhoto,
          });
          setCandidate({
            id: "mock-candidate-1",
            titre:
              localStorage.getItem("mock_candidate_titre") || "Directeur des Ressources Humaines",
            diplome:
              localStorage.getItem("mock_candidate_diplome") ||
              "Master en Management des Ressources Humaines — Université Félix Houphouët-Boigny",
            bio:
              localStorage.getItem("mock_candidate_bio") ||
              "Professionnel RH avec 8 ans d'expérience en gestion des talents, droit social et administration du personnel en Côte d'Ivoire. Passionné par l'accompagnement des équipes et la transformation organisationnelle.",
            disponibilite: localStorage.getItem("mock_candidate_disponibilite") || "Immédiate",
            pretention_salariale:
              localStorage.getItem("mock_candidate_pretention_salariale") ||
              "1 500 000 – 2 000 000 FCFA",
            competences:
              localStorage.getItem("mock_candidate_competences") ||
              "Recrutement, Droit social, SYSCOHADA, Leadership, Gestion des conflits, Formation",
          });
          setLoading(false);
          return;
        }

        const cid = await ensureCandidate(user.id);
        const [{ data: p }, { data: c }] = await Promise.all([
          supabase
            .from("profiles")
            .select("prenom, nom, telephone, ville, photo_url")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("candidates")
            .select("id, titre, diplome, bio, disponibilite, pretention_salariale, competences")
            .eq("id", cid)
            .single(),
        ]);
        if (p)
          setProfile({
            prenom: p.prenom ?? "",
            nom: p.nom ?? "",
            telephone: p.telephone ?? "",
            ville: p.ville ?? "",
            photo_url: p.photo_url ?? null,
          });
        if (c)
          setCandidate({
            id: c.id,
            titre: c.titre ?? "",
            diplome: c.diplome ?? "",
            bio: c.bio ?? "",
            disponibilite: c.disponibilite ?? "",
            pretention_salariale: c.pretention_salariale ?? "",
            competences: (c.competences ?? []).join(", "),
          });
      } catch (err) {
        console.warn("Failed to load profile, using mock data:", err);
        setProfile({
          prenom: "Koffi",
          nom: "Anan",
          telephone: "+225 07 08 09 10 11",
          ville: "Abidjan",
          photo_url: null,
        });
        setCandidate({
          id: "mock-candidate-1",
          titre: "Directeur des Ressources Humaines",
          diplome: "Master en Management des Ressources Humaines",
          bio: "Professionnel RH avec 8 ans d'expérience en gestion des talents.",
          disponibilite: "Immédiate",
          pretention_salariale: "1 500 000 – 2 000 000 FCFA",
          competences: "Recrutement, Droit social, SYSCOHADA",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    // Handle mock mode
    if (user.id === "mock-candidate-1") {
      localStorage.setItem("mock_candidate_prenom", profile.prenom);
      localStorage.setItem("mock_candidate_nom", profile.nom);
      localStorage.setItem("mock_candidate_telephone", profile.telephone);
      localStorage.setItem("mock_candidate_ville", profile.ville);

      localStorage.setItem("mock_candidate_titre", candidate.titre);
      localStorage.setItem("mock_candidate_diplome", candidate.diplome);
      localStorage.setItem("mock_candidate_bio", candidate.bio);
      localStorage.setItem("mock_candidate_disponibilite", candidate.disponibilite);
      localStorage.setItem("mock_candidate_pretention_salariale", candidate.pretention_salariale);
      localStorage.setItem("mock_candidate_competences", candidate.competences);

      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Profil mis à jour (Mode Démo).");
      return;
    }

    setSaving(true);
    try {
      const competences = candidate.competences
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const [{ error: e1 }, { error: e2 }] = await Promise.all([
        supabase.from("profiles").upsert({ id: user.id, ...profile }),
        supabase
          .from("candidates")
          .update({
            titre: candidate.titre || null,
            diplome: candidate.diplome || null,
            bio: candidate.bio || null,
            disponibilite: candidate.disponibilite || null,
            pretention_salariale: candidate.pretention_salariale || null,
            competences,
          })
          .eq("id", candidate.id),
      ]);
      if (e1 || e2) throw e1 ?? e2;
      toast.success("Profil mis à jour.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="dash-empty">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Chargement…</p>
      </div>
    );

  return (
    <>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="page-hero page-hero-candidat animate-reveal">
        <div
          className="page-hero-blob"
          style={{ width: 280, height: 280, background: "#2A5298", top: -100, right: -60 }}
        />
        <div
          className="page-hero-blob"
          style={{ width: 160, height: 160, background: "#93C5FD", bottom: -60, left: 60 }}
        />
        <div className="hero-content">
          <div className="dash-section-title" style={{ color: "rgba(255,255,255,0.6)" }}>
            Identité
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Mon profil</h1>
          <p className="text-white/60 text-sm mt-1">
            Renseignez vos informations pour être visible des recruteurs
          </p>
        </div>
      </div>

      {/* Photo upload */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm p-5 flex items-center gap-5 mb-6">
        <div className="w-20 h-20 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt="Photo de profil"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl">👤</span>
          )}
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
          >
            Téléverser une photo
          </Button>
          <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG. Max 2 Mo recommandé.</p>
        </div>
      </div>

      <form onSubmit={onSave} className="grid gap-6 max-w-3xl">
        {/* Section: État civil */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 bg-gradient-to-r from-blue-50 to-white flex items-center gap-2">
            <span className="text-lg">📄</span>
            <h2 className="font-display font-bold text-base text-foreground">État civil</h2>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <Field label="Prénom">
              <Input
                value={profile.prenom}
                onChange={(e) => setProfile({ ...profile, prenom: e.target.value })}
                className="rounded-xl"
              />
            </Field>
            <Field label="Nom">
              <Input
                value={profile.nom}
                onChange={(e) => setProfile({ ...profile, nom: e.target.value })}
                className="rounded-xl"
              />
            </Field>
            <Field label="Téléphone">
              <Input
                value={profile.telephone}
                onChange={(e) => setProfile({ ...profile, telephone: e.target.value })}
                className="rounded-xl"
              />
            </Field>
            <Field label="Ville">
              <Input
                value={profile.ville}
                onChange={(e) => setProfile({ ...profile, ville: e.target.value })}
                className="rounded-xl"
              />
            </Field>
          </div>
        </div>

        {/* Section: Parcours professionnel */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 bg-gradient-to-r from-purple-50 to-white flex items-center gap-2">
            <span className="text-lg">💼</span>
            <h2 className="font-display font-bold text-base text-foreground">
              Parcours professionnel
            </h2>
          </div>
          <div className="p-5 grid gap-4">
            <Field label="Titre / Intitulé du poste recherché">
              <Input
                value={candidate.titre}
                onChange={(e) => setCandidate({ ...candidate, titre: e.target.value })}
                placeholder="Ex. Développeuse front-end senior"
                className="rounded-xl"
              />
            </Field>
            <Field label="Diplôme principal">
              <Input
                value={candidate.diplome}
                onChange={(e) => setCandidate({ ...candidate, diplome: e.target.value })}
                className="rounded-xl"
              />
            </Field>
            <Field label="Compétences (séparées par des virgules)">
              <Input
                value={candidate.competences}
                onChange={(e) => setCandidate({ ...candidate, competences: e.target.value })}
                placeholder="React, TypeScript, Figma"
                className="rounded-xl"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Disponibilité">
                <Input
                  value={candidate.disponibilite}
                  onChange={(e) => setCandidate({ ...candidate, disponibilite: e.target.value })}
                  placeholder="Sous 1 mois"
                  className="rounded-xl"
                />
              </Field>
              <Field label="Prétention salariale">
                <Input
                  value={candidate.pretention_salariale}
                  onChange={(e) =>
                    setCandidate({ ...candidate, pretention_salariale: e.target.value })
                  }
                  placeholder="45 – 55 k€"
                  className="rounded-xl"
                />
              </Field>
            </div>
            <Field label="Bio / présentation">
              <Textarea
                rows={6}
                value={candidate.bio}
                onChange={(e) => setCandidate({ ...candidate, bio: e.target.value })}
                className="rounded-xl"
              />
            </Field>
          </div>
        </div>

        <div>
          <Button type="submit" disabled={saving} size="lg" className="rounded-xl px-8">
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
