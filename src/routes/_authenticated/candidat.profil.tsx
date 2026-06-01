import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

  const [profile, setProfile] = useState({ prenom: "", nom: "", telephone: "", ville: "" });
  const [candidate, setCandidate] = useState({
    id: "",
    titre: "",
    diplome: "",
    bio: "",
    disponibilite: "",
    pretention_salariale: "",
    competences: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        if (user.id === "mock-candidate-1") {
          setProfile({ prenom: "Koffi", nom: "Anan", telephone: "+225 07 08 09 10 11", ville: "Abidjan" });
          setCandidate({
            id: "mock-candidate-1",
            titre: "Directeur des Ressources Humaines",
            diplome: "Master en Management des Ressources Humaines — Université Félix Houphouët-Boigny",
            bio: "Professionnel RH avec 8 ans d'expérience en gestion des talents, droit social et administration du personnel en Côte d'Ivoire. Passionné par l'accompagnement des équipes et la transformation organisationnelle.",
            disponibilite: "Immédiate",
            pretention_salariale: "1 500 000 – 2 000 000 FCFA",
            competences: "Recrutement, Droit social, SYSCOHADA, Leadership, Gestion des conflits, Formation",
          });
          setLoading(false);
          return;
        }

        const cid = await ensureCandidate(user.id);
        const [{ data: p }, { data: c }] = await Promise.all([
          supabase.from("profiles").select("prenom, nom, telephone, ville").eq("id", user.id).maybeSingle(),
          supabase.from("candidates").select("id, titre, diplome, bio, disponibilite, pretention_salariale, competences").eq("id", cid).single(),
        ]);
        if (p) setProfile({ prenom: p.prenom ?? "", nom: p.nom ?? "", telephone: p.telephone ?? "", ville: p.ville ?? "" });
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
        setProfile({ prenom: "Koffi", nom: "Anan", telephone: "+225 07 08 09 10 11", ville: "Abidjan" });
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

  if (loading) return <div className="text-sm font-mono text-muted-foreground">Chargement…</div>;

  return (
    <>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Identité</div>
      <h1 className="font-display italic text-5xl mb-10">Mon profil.</h1>

      <form onSubmit={onSave} className="grid gap-10 max-w-3xl">
        <section className="grid gap-4">
          <h2 className="font-display italic text-2xl">État civil</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Prénom"><Input value={profile.prenom} onChange={(e) => setProfile({ ...profile, prenom: e.target.value })} /></Field>
            <Field label="Nom"><Input value={profile.nom} onChange={(e) => setProfile({ ...profile, nom: e.target.value })} /></Field>
            <Field label="Téléphone"><Input value={profile.telephone} onChange={(e) => setProfile({ ...profile, telephone: e.target.value })} /></Field>
            <Field label="Ville"><Input value={profile.ville} onChange={(e) => setProfile({ ...profile, ville: e.target.value })} /></Field>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display italic text-2xl">Parcours professionnel</h2>
          <Field label="Titre / Intitulé du poste recherché"><Input value={candidate.titre} onChange={(e) => setCandidate({ ...candidate, titre: e.target.value })} placeholder="Ex. Développeuse front-end senior" /></Field>
          <Field label="Diplôme principal"><Input value={candidate.diplome} onChange={(e) => setCandidate({ ...candidate, diplome: e.target.value })} /></Field>
          <Field label="Compétences (séparées par des virgules)"><Input value={candidate.competences} onChange={(e) => setCandidate({ ...candidate, competences: e.target.value })} placeholder="React, TypeScript, Figma" /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Disponibilité"><Input value={candidate.disponibilite} onChange={(e) => setCandidate({ ...candidate, disponibilite: e.target.value })} placeholder="Sous 1 mois" /></Field>
            <Field label="Prétention salariale"><Input value={candidate.pretention_salariale} onChange={(e) => setCandidate({ ...candidate, pretention_salariale: e.target.value })} placeholder="45 – 55 k€" /></Field>
          </div>
          <Field label="Bio / présentation"><Textarea rows={6} value={candidate.bio} onChange={(e) => setCandidate({ ...candidate, bio: e.target.value })} /></Field>
        </section>

        <div>
          <Button type="submit" disabled={saving} size="lg">{saving ? "Enregistrement…" : "Enregistrer"}</Button>
        </div>
      </form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
